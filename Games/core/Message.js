const shortid = require("shortid");
const Utils = require("./Utils");

module.exports = class Message {
  constructor(info) {
    this.id = info.id || shortid.generate();
    this.sender = info.sender;
    this.content = info.content;
    this.game = info.game;
    this.meeting = info.meeting;
    this.isServer = info.isServer;
    this.recipients = info.recipients;
    this.prefix = info.prefix;
    this.abilityName = info.abilityName;
    this.abilityTarget = info.abilityTarget;
    this.forceLeak = info.forceLeak;
    this.anonymous = info.anonymous;
    this.versions = {};
    this.timeSent = info.timeSent;
    this.quotable = info.quotable || true;
    this.modified = false;
  }

  send() {
    this.timeSent = Date.now();

    if (!this.meeting && !this.recipients) {
      this.globalAlert = true;
      this.recipients = this.game.players.array();
    }

    if (this.anonymous) {
      this.versions["*"] = new Message(this);
      this.anonymous = false;
    } else this.versions["*"] = this;

    if (this.sender) {
      var newVersion = this.sender.speak(this.versions["*"]);

      if (!newVersion) return;

      if (newVersion.modified) newVersion.modified = false;

      this.versions["*"] = newVersion;
    }

    if (this.meeting) this.meeting.messages.push(this);
    else this.game.history.addAlert(this);

    for (let player of this.versions["*"].recipients)
      player.hear(this.versions["*"], this);

    if (
      this.globalAlert ||
      (this.meeting && this.game.isSpectatorMeeting(this.meeting))
    )
      this.game.spectatorsHear(this.versions["*"]);

    this.game.events.emit("message", this);
  }

  getMessageInfo(player) {
    var playerId, version, senderId;

    if (player == "spectator") {
      playerId = "spectator";
      version = this.versions["*"];

      if (
        version &&
        !version.meeting &&
        version.recipients &&
        !version.globalAlert
      )
        return;
    } else if (player) {
      playerId = player.id;
      version = this.versions[playerId];

      if (!version) return;
    } else if (this.versions["*"].parseForReview)
      version = this.versions["*"].parseForReview(this);

    if (!version) version = this;

    if (version.isServer) senderId = "server";
    else if (
      version.anonymous &&
      (player.alive || (!player.alive && version.sender.alive))
    )
      senderId = "anonymous";
    else if (version.sender) {
      senderId = version.sender.id;
      
      if (version.sender.user && version.sender.user.settings) {
        if (version.sender.anonId !== undefined) {
          version.textColor =
            version.sender.user.textColor !== undefined
              ? Utils.adjustColor(version.sender.user.textColor)
              : "";
          version.nameColor =
            version.sender.user.nameColor !== undefined
              ? Utils.adjustColor(version.sender.user.nameColor)
              : "";
        }
        else {
          version.textColor =
            version.sender.user.settings.textColor !== undefined
              ? Utils.adjustColor(version.sender.user.settings.textColor)
              : "";
          version.nameColor =
            version.sender.user.settings.nameColor !== undefined
              ? Utils.adjustColor(version.sender.user.settings.nameColor)
              : "";
        }
      }
    } else return;

    return this.parseMessageInfoObj(version, senderId);
  }

  parseMessageInfoObj(version, senderId) {
    return {
      id: version.id,
      senderId: senderId,
      content: version.content,
      meetingId: version.meeting && version.meeting.id,
      prefix: version.prefix,
      time: version.timeSent,
      quotable: version.quotable,
      textColor: version.textColor || "",
      nameColor: version.nameColor || "",
      alive: version.alive !== undefined ? version.alive : undefined,
    };
  }
};

const shortid = require("shortid");
const constants = require("../../data/constants");
const colorContrast = require("color-contrast");

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

      if (version.sender.anonId !== undefined) {
        version.textColor = version.sender.user.textColor !== undefined ? this.adjustColor(version.sender.user.textColor) : "";  
        version.nameColor = version.sender.user.nameColor !== undefined ? this.adjustColor(version.sender.user.nameColor) : "";
      }
      else{
        version.textColor = version.sender.user.settings.textColor !== undefined ? this.adjustColor(version.sender.user.settings.textColor) : "";
        version.nameColor = version.sender.user.settings.nameColor !== undefined ? this.adjustColor(version.sender.user.settings.nameColor) : "";
      }
    }
    else return;

    return this.parseMessageInfoObj(version, senderId);
  }

  getIncreasedBrightness(color1, color2) {
    let contrastVal = colorContrast(color1, color2);
    if (contrastVal < 1.5) {
      return this.increaseBrightness(color1, 60);
    }
    else if (contrastVal <= 2.5) {
      return this.increaseBrightness(color1, 45);
    }
    else if (contrastVal <= 4.5) {
      return this.increaseBrightness(color1, 30);
    }
    else {
      return color1;
    }
  }

  getDecreasedBrightness(color1, color2) {
    let contrastVal = colorContrast(color1, color2);
    if (contrastVal < 1.5) {
      return this.decreaseBrightness(color1, 50);
    }
    else if (contrastVal <= 2.5) {
      return this.decreaseBrightness(color1, 40);
    }
    else if (contrastVal <= 4.5) {
      return this.decreaseBrightness(color1, 30);
    }
    else {
      return color1;
    }
  }

  adjustColor(color) {
      return  {
        darkTheme: this.getIncreasedBrightness(color, "#181a1b"),
        lightTheme: this.getDecreasedBrightness(color, "#ffffff")
      };
  }

  increaseBrightness(color, percent) {
    let num = parseInt(color.replace("#", ""), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) + amt,
      B = ((num >> 8) & 0x00ff) + amt,
      G = (num & 0x0000ff) + amt;
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (B < 255 ? (B < 1 ? 0 : B) : 255) * 0x100 +
        (G < 255 ? (G < 1 ? 0 : G) : 255)
      )
        .toString(16)
        .slice(1)
    );
  }

  decreaseBrightness(color, percent) {
    let num = parseInt(color.replace("#", ""), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) - amt,
      B = ((num >> 8) & 0x00ff) - amt,
      G = (num & 0x0000ff) - amt;
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (B < 255 ? (B < 1 ? 0 : B) : 255) * 0x100 +
        (G < 255 ? (G < 1 ? 0 : G) : 255)
      )
        .toString(16)
        .slice(1)
    );
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

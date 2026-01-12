const Player = require("./Player");
const Message = require("./Message");
const Quote = require("./Quote");
const Utils = require("./Utils");
const Spam = require("./Spam");
const constants = require("../../data/constants");
const logger = require("../../modules/logging")("games");

module.exports = class Spectator extends Player {
  constructor(user, game) {
    super(user, game);

    this.spectator = true;
    this.history = this.game.spectatorHistory;
  }

  init() {
    this.socketListeners();
    this.gameEventListeners();
  }

  socketListeners() {
    const socket = this.socket;
    var speechPast = [];

    socket.on("leave", () => {
      try {
        this.leaveGame();
      } catch (e) {
        logger.error(e);
      }
    });

    socket.on("disconnected", () => {
      try {
        var index = this.game.spectators.indexOf(this);

        if (index == -1) return;

        this.game.spectators.splice(index, 1);
        this.game.broadcast("spectatorCount", this.game.spectators.length);
      } catch (e) {
        logger.error(e);
      }
    });

    socket.on("speak", (message) => {
      try {
        if (typeof message != "object") return;

        message.content = String(message.content);
        message.meetingId = String(message.meetingId) || "";
        message.abilityName = String(message.abilityName || "");
        message.abilityTarget = String(message.abilityTarget || "");

        if (!Utils.validProp(message.meetingId)) return;

        if (!Utils.validProp(message.abilityName)) return;

        if (!Utils.validProp(message.abilityTarget)) return;

        if (message.content.length == 0) return;

        if (!message.abilityName) delete message.abilityName;

        if (!message.abilityTarget) delete message.abilityTarget;

        message.content = message.content.slice(
          0,
          constants.maxGameMessageLength
        );

        if (
          Spam.rateLimit(
            speechPast,
            constants.msgSpamSumLimit,
            constants.msgSpamRateLimit
          )
        ) {
          this.sendAlert("You are speaking too quickly!");
          return;
        }

        if (
          message.content[0] == "/" &&
          message.content.slice(0, 4) != "/me "
        ) {
          this.parseCommand(message);
          return;
        }

        speechPast.push(Date.now());

        var meeting = this.game.getMeeting(message.meetingId);
        if (!meeting) return;

        meeting.speak({
          sender: this,
          content: message.content,
          abilityName: message.abilityName,
          abilityTarget: message.abilityTarget,
          forceLeak: message.forceLeak,
        });
      } catch (e) {
        logger.error(e);
        // this.handleError(e);
      }
    });

    socket.on("quote", (quote) => {
      try {
        if (typeof quote != "object") return;

        quote.messageId = String(quote.messageId);
        quote.toMeetingId = String(quote.toMeetingId);
        quote.fromMeetingId = String(quote.fromMeetingId);
        quote.fromState = String(quote.fromState);
        quote.messageContent = String(quote.messageContent);

        if (!Utils.validProp(quote.messageId)) return;

        if (!Utils.validProp(quote.toMeetingId)) return;

        if (!Utils.validProp(quote.fromMeetingId)) return;

        if (!Utils.validProp(quote.fromState)) return;

        if (
          Spam.rateLimit(
            speechPast,
            constants.msgSpamSumLimit,
            constants.msgSpamRateLimit
          )
        ) {
          this.sendAlert("You are speaking too quickly!");
          return;
        }

        speechPast.push(Date.now());

        var meeting = this.game.getMeeting(quote.toMeetingId);
        if (!meeting) return;

        meeting.quote(this, quote);
      } catch (e) {
        logger.error(e);
        // this.handleError(e);
      }
    });

    socket.on("slurDetected", () => {
      this.sendAlert(
        "Warning: Your message contains inappropriate language. Please revise your message without using offensive terms."
      );
    });
  }

  gameEventListeners() {}

  sendSelf() {
    super.sendSelf();
    this.send("isSpectator");
  }

  sendMeeting(meeting) {
    if(meeting.name == "Spectator Meeting"){
      this.send("meeting", meeting.getMeetingInfo(this));
    }
    else{
    this.send("meeting", meeting.getMeetingInfo("spectator"));
    }
  }

  leaveGame() {
    this.game.removeSpectator(this);
    this.send("left");
  }

  hear(message) {
    message = message.getMessageInfo("spectator");

    if (message) this.send("message", message);
  }

  hearQuote(quote) {
    quote = quote.getMessageInfo("spectator");

    if (quote) this.send("quote", quote);
  }

  seeVote(vote) {
    this.send("vote", {
      voterId: vote.voter.id,
      target: vote.target,
      meetingId: vote.meeting.id,
    });
  }

  seeUnvote(info) {
    this.send("unvote", {
      voterId: info.voter.id,
      meetingId: info.meeting.id,
    });
  }
};

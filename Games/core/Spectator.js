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
    var lastSpeakContentBlockAt = 0;

    socket.on("leave", () => {
      try {
        this.leaveGame();
      } catch (e) {
        logger.error(e);
      }
    });

    socket.on("takeSeat", () => {
      try {
        Promise.resolve(this.game.takeSeat(this)).catch((e) => logger.error(e));
      } catch (e) {
        logger.error(e);
      }
    });

    // The app's "spectate" event from someone already watching.
    socket.on("spectate", () => {
      this.send("spectateFailed", "You are already spectating this game.");
    });

    socket.on("getTimerInfo", () => {
      try {
        this.game.resendTimers(this);
      } catch (e) {
        logger.error(e);
      }
    });

    socket.on("disconnected", () => {
      try {
        if (this.socket !== socket) return; // replaced by a reconnect
        this.game.scheduleSpectatorRemoval(this, socket);
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
          const sentAt = Date.now();
          this.send("speakCooldown", {
            meetingId: message.meetingId,
            sentAt,
            cooldownMs: Spam.getCooldownMs(
              speechPast,
              constants.msgSpamSumLimit,
              constants.msgSpamRateLimit
            ),
          });
          return;
        }

        if (
          this.game.started &&
          Spam.isRepeatedContentSpam(
            speechPast,
            message.content,
            constants.msgDuplicateMaxConsecutive
          )
        ) {
          lastSpeakContentBlockAt = Date.now();
          const sentAt = Date.now();
          this.send("speakCooldown", {
            meetingId: message.meetingId,
            sentAt,
            cooldownMs: constants.msgDuplicateCooldownMs,
          });
          return;
        }

        if (
          this.game.started &&
          Spam.shouldCheckSimilarContent(
            speechPast,
            lastSpeakContentBlockAt,
            Date.now(),
            constants.msgSimilarQuickWindowMs,
            constants.msgSimilarAfterBlockWindowMs
          ) &&
          Spam.isRepeatedSimilarContentSpam(
            speechPast,
            message.content,
            constants.msgDuplicateMaxConsecutive,
            constants.msgSimilarThreshold,
            constants.msgSimilarMinLength
          )
        ) {
          lastSpeakContentBlockAt = Date.now();
          const sentAt = Date.now();
          this.send("speakCooldown", {
            meetingId: message.meetingId,
            sentAt,
            cooldownMs: constants.msgDuplicateCooldownMs,
          });
          return;
        }

        if (this.applyTextEffect(message)) return;

        if (
          message.content[0] == "/" &&
          message.content.slice(0, 4) != "/me "
        ) {
          this.parseCommand(message);
          return;
        }

        speechPast.push({
          at: Date.now(),
          content: Spam.normalizeSpeakContent(message.content),
        });

        var meeting = this.game.getMeeting(message.meetingId);
        if (!this.canSpeakIn(meeting)) return;

        meeting.speak({
          sender: this,
          content: message.content,
          abilityName: message.abilityName,
          abilityTarget: message.abilityTarget,
          forceLeak: message.forceLeak,
          textEffect: message.textEffect,
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
          const sentAt = Date.now();
          this.send("speakCooldown", {
            meetingId: quote.toMeetingId,
            sentAt,
            cooldownMs: Spam.getCooldownMs(
              speechPast,
              constants.msgSpamSumLimit,
              constants.msgSpamRateLimit
            ),
          });
          return;
        }

        speechPast.push(Date.now());

        var meeting = this.game.getMeeting(quote.toMeetingId);
        if (!this.canSpeakIn(meeting)) return;

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

  // Spectators talk only in Pregame (before the start) and in the
  // spectator meeting, always under their own name. Any other meeting id
  // from a spectator's socket is ignored.
  canSpeakIn(meeting) {
    if (!meeting) return false;
    if (meeting === this.game.spectatorMeeting) return true;
    return (
      meeting === this.game.pregame &&
      !this.game.started &&
      !this.game.starting
    );
  }

  gameEventListeners() {}

  sendSelf() {
    super.sendSelf();
    this.send("isSpectator");
    if (this.omniscient) this.send("omniscientSpectator");
  }

  getMeetings(state) {
    if (!this.omniscient) return super.getMeetings(state);

    const spectatorOnly = this.game.spectatorHistory
      .getMeetings(state)
      .filter((m) => this.game.isSpectatorOnlyMeeting(m));
    return this.game.history.getMeetings(state).concat(spectatorOnly);
  }

  sendMeetings(meetings) {
    super.sendMeetings(meetings);
    if (this.omniscient) this.sendTrueRoles();
  }

  sendTrueRoles() {
    const roles = this.game.getTrueRoles();
    for (let playerId in roles)
      this.send("reveal", { playerId, role: roles[playerId] });
  }

  getHistory(targetState) {
    if (!this.omniscient) return super.getHistory(targetState);
    return this.game.getOmniscientHistoryInfo(this, targetState);
  }

  hearOmniscient(message) {
    const info = this.game.getOmniscientMessageInfo(message);
    if (!info) return;
    this.send(message.isQuote ? "quote" : "message", info);
  }

  sendMeeting(meeting) {
    const isMember = meeting.members && meeting.members[this.id];

    if (meeting.name == "Spectator Meeting" || isMember) {
      const info = meeting.getMeetingInfo(this);

      // Member versions are per player id. Pregame chat is public, so use
      // the spectator transcript while still advertising canTalk.
      if (meeting.name == "Pregame") {
        info.messages = meeting.getPlayerMessages("spectator");
      }

      this.send("meeting", info);
    } else if (this.omniscient && !this.game.isSpectatorOnlyMeeting(meeting)) {
      this.send("meeting", this.game.getOmniscientMeetingInfo(meeting));
    } else {
      this.send("meeting", meeting.getMeetingInfo("spectator"));
    }
  }

  leaveGame() {
    this.game.removeSpectator(this);
    this.send("left");
  }

  hear(message) {
    var info = message.getMessageInfo("spectator");

    // The spectator view hides alerts aimed at particular players. An alert
    // aimed at this spectator (a /join refusal, /role output) is theirs.
    if (
      !info &&
      message.isServer &&
      !message.meeting &&
      message.recipients &&
      message.recipients.indexOf(this) != -1
    ) {
      info = message.parseMessageInfoObj(message, "server");
    }

    if (info) this.send("message", info);
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

  seeTyping(info) {
    this.send("typing", {
      playerId: info.playerId,
      meetingId: info.meetingId,
    });
  }
};

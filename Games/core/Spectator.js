const Player = require("./Player");
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
    const { socket } = this;

    socket.on("leave", () => {
      try {
        this.leaveGame();
      } catch (e) {
        logger.error(e);
      }
    });

    socket.on("disconnected", () => {
      try {
        const index = this.game.spectators.indexOf(this);

        if (index == -1) return;

        this.game.spectators.splice(index, 1);
        this.game.broadcast("spectatorCount", this.game.spectators.length);
      } catch (e) {
        logger.error(e);
      }
    });
  }

  gameEventListeners() {}

  sendSelf() {
    super.sendSelf();
    this.send("isSpectator");
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

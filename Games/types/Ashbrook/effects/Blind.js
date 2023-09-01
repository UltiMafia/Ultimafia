const Effect = require("../Effect");

module.exports = class Blind extends Effect {
  constructor(lifespan) {
    super("Blind");
    this.lifespan = lifespan || Infinity;
  }

  hear(message) {
    if (!message.isServer) {
      message.anonymous = true;
      message.modified = true;
    }
  }

  hearQuote(quote) {
    quote.anonymous = true;
    quote.modified = true;
  }

  seeVote(vote) {
    if (vote.voter != this.player) vote.cancel = true;
  }

  seeUnvote(info) {
    if (info.voter != this.player) info.cancel = true;
  }

  seeTyping(info) {
    if (info.playerId != this.player.id) info.cancel = true;
  }
};

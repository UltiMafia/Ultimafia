const Effect = require("../Effect");
const Random = require("../../../../lib/Random");

module.exports = class Scrambled extends Effect {
  constructor(lifespan) {
    super("Scrambled");
    this.lifespan = lifespan || Infinity;
  }

  hear(message) {
    if (message.sender != this.player) {
      var possibleSenders = message.game.players.filter(
        (p) => p != this.player && p.alive
      );
      message.sender = Random.randArrayVal(possibleSenders);
      message.modified = true;
    }
  }

  hearQuote(quote) {
    if (quote.sender != this.player) {
      var possibleSenders = quote.game.players.filter(
        (p) => p != this.player && p.alive
      );
      quote.sender = Random.randArrayVal(possibleSenders);
      quote.modified = true;
    }
  }

};

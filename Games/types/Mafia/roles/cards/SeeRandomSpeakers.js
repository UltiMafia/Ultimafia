const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class SeeRandomSpeakers extends Card {
  constructor(role) {
    super(role);
  }

  hear(message) {
    if (message.sender != this.role.player) {
      const possibleSenders = message.game.players.filter(
        (p) => p != this.role.player && p.alive
      );
      message.sender = Random.randArrayVal(possibleSenders);
      message.modified = true;
    }
  }

  hearQuote(quote) {
    if (quote.sender != this.role.player) {
      const possibleSenders = quote.game.players.filter(
        (p) => p != this.role.player && p.alive
      );
      quote.sender = Random.randArrayVal(possibleSenders);
      quote.modified = true;
    }
  }
};

const Effect = require("../Effect");

module.exports = class Silenced extends Effect {
  constructor(lifespan) {
    super("Silenced");
    this.lifespan = lifespan || Infinity;
  }

  speak(message) {
    message.cancel = true;
  }

  speakQuote(quote) {
    quote.cancel = true;
  }

  parseForReview(message) {
    message.prefix = `(silenced)`;
    return message;
  }
};

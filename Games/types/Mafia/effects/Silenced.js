const Effect = require("../Effect");

module.exports = class Silenced extends Effect {
  constructor(lifespan) {
    super("Silenced");
    this.lifespan = lifespan || Infinity;
  }

  speak(message) {
    message.recipients = [this.player];
    message.modified = true;
    message.parseForReview = this.parseForReview;
  }

  speakQuote(quote) {
    quote.recipients = [this.player];
    quote.modified = true;
    quote.parseForReview = this.parseForReview;
  }

  parseForReview(message) {
    message.prefix = "silenced";
    message.recipients = message.versions["*"].recipients;
    return message;
  }
};

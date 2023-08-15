const Effect = require("../Effect");

module.exports = class Quiet extends Effect {
  constructor(lifespan) {
    super("Quiet");
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

  speakWhisper(message) {
    if (message.abilityName === "Whisper") {
    message.recipients = [this.player];
    message.modified = false;
  }}

  parseForReview(message) {
    message.prefix = "Quiet";
    message.recipients = message.versions["*"].recipients;
    return message;
  }
};

const Effect = require("../Effect");

module.exports = class BlockWhispers extends Effect {
  constructor(lifespan) {
    super("Block Whispers");
    this.lifespan = lifespan ?? Infinity;
  }

  speak(message) {
    if (message.abilityName === "Whisper") {
      message.recipients = [this.player];
      message.parseForReview = this.parseForReview;
      message.modified = true;
    }
  }

  hear(message) {
    if (message.abilityName === "Whisper" && message.abilityTarget == this.player.id) {
      message.cancel = true;
    }
  }

  parseForReview(message) {
    message.recipients = message.versions["*"].recipients;
    return message;
  }
};

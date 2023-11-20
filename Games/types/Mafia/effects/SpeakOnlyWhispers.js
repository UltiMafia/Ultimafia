const Effect = require("../Effect");

module.exports = class LeakWhispers extends Effect {
  constructor(lifespan) {
    super("Speak Only Whispers");
    this.lifespan = lifespan ?? Infinity;
  }

  speak(message) {
    if (message.abilityName != "Whisper") {
      message.recipients = [this.player];
      message.parseForReview = this.parseForReview;
      message.modified = true;
    }
  }

  hear(message) {
    if (
      message.abilityName != "Whisper" &&
      message.abilityTarget == this.player.id
    ) {
      message.cancel = true;
    }
  }

  speak(message) {
    if (message.abilityName === "Whisper") {
      message.forceLeak = false;
    }
  }

  hear(message) {
    if (message.abilityName === "Whisper") {
      message.forceLeak = false;
    }
  }

  parseForReview(message) {
    message.recipients = message.versions["*"].recipients;
    return message;
  }
};

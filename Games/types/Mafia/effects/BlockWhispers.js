const Effect = require("../Effect");

module.exports = class BlockWhispers extends Effect {
  constructor(lifespan) {
    super("Block Whispers");
    this.lifespan = lifespan ?? Infinity;
  }

  speak(message) {
    if (message.abilityName === "Whisper") {
      message.cancel = true;
    }
  }

  hear(message) {
    if (message.abilityName === "Whisper") {
      message.cancel = true;
    }
  }
};

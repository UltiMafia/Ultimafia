const Effect = require("../Effect");

module.exports = class Fiddled extends Effect {
  constructor(lifespan) {
    super("Leak Whispers");
    this.lifespan = lifespan ?? Infinity;
  }

  speak(message) {
    if (message.abilityName === "Whisper") {
      message.forceLeak = true;
    }
  }
};

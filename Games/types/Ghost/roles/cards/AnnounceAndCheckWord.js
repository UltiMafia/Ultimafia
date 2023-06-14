const Card = require("../../Card");

module.exports = class AnnounceAndCheckWord extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start() {
        this.player.queueAlert(`The secret word is: ${this.word}`);
      },
    };
  }

  speak(message) {
    if (message.content.replace(" ", "").toLowerCase().includes(this.word)) {
      this.player.sendAlert("Be careful not to say the secret word!");
    }
  }
};

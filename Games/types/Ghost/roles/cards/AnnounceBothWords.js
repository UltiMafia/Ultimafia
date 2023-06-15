const Card = require("../../Card");

module.exports = class AnnounceAndCheckWord extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function () {
        this.player.sendAlert(
          `The town word is [${this.game.townWord}] and the fool word is [${this.game.foolWord}].`
        );
      },
    };
  }

  speak(message) {
    if (
      message.content
        .replace(" ", "")
        .toLowerCase()
        .includes(this.game.townWord)
    ) {
      this.player.sendAlert("Be careful not to say the secret word!");
    }
  }
};

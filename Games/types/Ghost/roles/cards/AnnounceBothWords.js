const Card = require("../../Card");

module.exports = class AnnounceAndCheckWord extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function () {
        this.player.sendAlert(`The town word is ${this.game.townWord}.`);

        if (this.game.hasFool) {
          this.player.sendAlert(`The fool word is ${this.game.foolWord}.`);
        }
      },
    };
  }

};

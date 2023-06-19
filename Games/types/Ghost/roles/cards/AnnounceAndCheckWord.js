const Card = require("../../Card");

module.exports = class AnnounceAndCheckWord extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function () {
        this.player.sendAlert(`The secret word is: ${this.word}`);
      },
    };
  }
  
};

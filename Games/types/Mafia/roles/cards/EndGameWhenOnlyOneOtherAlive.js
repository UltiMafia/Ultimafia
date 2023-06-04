const Card = require("../../Card");

module.exports = class EndGameAtAnyTime extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function () {
        if (this.game.alivePlayers().length <= 2) {
          this.winCount = "Village";
        }
      },
    };
  }
};

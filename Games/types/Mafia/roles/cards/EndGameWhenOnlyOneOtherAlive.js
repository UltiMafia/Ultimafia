const Card = require("../../Card");

module.exports = class EndGameWhenOnlyOneOtherAlive extends Card {
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

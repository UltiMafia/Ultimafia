const Card = require("../../Card");

module.exports = class WinWithLiberals extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      check: function (winners) {
        let enactedEnough = this.game.numLiberalPolicyEnacted == 5;
        if (enactedEnough) {
          this.game.queueAlert("The fascists have enacted five policies!");
        }

        if (this.game.hitlerAssassinated) {
          this.game.queueAlert("Hitler has been assasinated!");
        }

        if (enactedEnough || this.game.hitlerAssassinated) {
          winners.addPlayer(this.player, "Liberals");
        }
      },
    };
  }
};

const Card = require("../../Card");
const Action = require("../../Action");

module.exports = class GainDiceOnCorrectSpotOnCall extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      SpotOnCall: function (Player, Correct, Bidder) {
        if (Player != this.player) {
          return;
        }
        if (!Correct) {
          return;
        }
        this.game.addDice(this.player);
      },
    };
  }
};

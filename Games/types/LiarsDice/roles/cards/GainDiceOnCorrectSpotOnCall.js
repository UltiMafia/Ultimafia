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
        if (this.hasGained == true) {
          return;
        }
        this.hasGained = true;
        this.game.addDice(this.player);
      },
    };
  }
};

const Card = require("../../Card");
const Action = require("../../Action");

module.exports = class GainDiceOnCorrectLieCall extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      LieCall: function (Player, Correct, Bidder) {
        if (Player != this.player) {
          return;
        }
        if (Correct == false) {
          return;
        }
        this.game.queueAlert(
              `${this.target.name} gains a Gun and ${Bidder.name} keeps their Dice!`
            );
        this.player.holdItem("Gun");
        this.game.addDice(Bidder, 1, false, true);
      },
    };
  }
};

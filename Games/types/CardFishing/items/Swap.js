const Item = require("../Item");

module.exports = class Swap extends Item {
  constructor() {
    super("Swap");

    this.meetings = {
      "Swap With": {
        states: ["Turn"],
        flags: ["voting", "instant"],
        inputType: "custom",
        targets: [],
        action: {
          item: this,
          run: function () {
            this.actor.data.swapped = this.target;
          },
        },
      },
      "Swap For": {
        states: ["Turn"],
        flags: ["voting", "instant"],
        inputType: "custom",
        targets: [],
        action: {
          item: this,
          run: function () {
            this.actor.swapCards(this.actor.data.swapped, this.target);
            delete this.actor.data.swapped;
            this.switchMoves("Swap");
          },
        },
      },
    };
  }

  hold(player) {
    super.hold(player);

    this.game.queueAlert(
      `${player.name} has chosen to swap cards…`
    );

    let playerHand = player.renderCards(player.hand);
    let cardPile = player.renderCards(player.cardPile);

    this.meetings["Swap With"].targets = playerHand;
    this.meetings["Swap For"].targets = cardPile;
  }
};

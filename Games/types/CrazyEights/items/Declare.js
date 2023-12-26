const Item = require("../Item");

module.exports = class Declare extends Item {
  constructor() {
    super("Declare");
    this.meetings = {
      "Declare Suit": {
        states: ["Turn"],
        flags: ["voting", "instant"],
        inputType: "custom",
        targets: [],
        action: {
          item: this,
          run: function () {
            this.game.drawDiscardPile.discard(`${this.target}8`);
            this.game.drawDiscardPile.refill();
            this.passMoveToNextPlayer("Declare");
          },
        },
      },
    };
  }

  hold(player) {
    super.hold(player);

    this.game.queueAlert(
      `${player.name} is declaring a suit…`
    );
    
    let allowedSuits = this.game.allowedSuits;
    this.meetings["Declare Suit"].targets = allowedSuits.slice();
  }
};
const Item = require("../Item");

module.exports = class Draw extends Item {
  constructor() {
    super("Draw");
    this.meetings = {
      "Draw Card": {
        states: ["Turn"],
        flags: ["voting", "instant"],
        inputType: "customBoolean",
        targets: ["Draw", "Pass"],
        displayOptions: {
          customBooleanNegativeReply: "Pass",
        },
        action: {
          item: this,
          run: function () {
            if (this.target === "Pass") {
              this.passMoveToNextPlayer("Draw");
              return;
            }
            if (this.game.draw2) {
              this.actor.drawCards(this.game.numToDraw);
              return;
            }
            if (!this.actor.checkIfCanPlace()) {
              this.actor.drawCards(1);
            } else {
              this.actor.switchMoves("Draw", "Place");
            }
          },
        },
      },
    };
  }

  hold(player) {
    super.hold(player);

    this.game.queueAlert(
      `${player.name} is drawing a card…`
    );
  }
};
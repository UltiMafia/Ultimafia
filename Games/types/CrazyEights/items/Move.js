const Item = require("../Item");

module.exports = class Move extends Item {
  constructor() {
    super("Move");
    this.meetings = {
      "Make Move": {
        states: ["Turn"],
        flags: ["voting", "instant", "mustAct"],
        inputType: "custom",
        targets: [],
        action: {
          item: this,
          run: function () {
            this.actor.switchMoves("Move", this.target);
          },
        },
      },
    };
  }

  hold(player) {
    super.hold(player);

    this.game.queueAlert(
      `${player.name} is making a move…`
    );

    let allowedMoves = [];

    if (player.checkIfCanPlace()) {
      allowedMoves.push("Place");
    } else {
      allowedMoves.push("Draw");
    }

    this.meetings["Make Move"].targets = allowedMoves.slice();
  }
};
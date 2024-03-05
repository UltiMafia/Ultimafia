const Item = require("../Item");

module.exports = class Move extends Item {
  constructor() {
    super("Move");

    this.meetings = {
      "Make Move": {
        states: ["Turn"],
        flags: ["voting", "instant"],
        inputType: "custom",
        targets: [],
        action: {
          item: this,
          run: function () {
            let move = this.target;
            let alert = `You chose to ${move.toLowerCase()}.`
            if (move === "Swap") {
              alert = `You chose to go and ${move.toLowerCase()} cards.`
            } else if (move === "Fish") {
              alert = `You chose to go and ${move.toLowerCase()} for cards.`
            }
            this.actor.queueAlert(alert);
            this.switchMoves("Move", move);
          },
        },
      },
    };
  }

  hold(player) {
    super.hold(player);

    this.game.queueAlert(
      `${player.name} is making their move…`
    );

    let validMoves = ["Swap"];

    if (player.checkCardsMatched()) {
      validMoves.push("Fish");
    }

    this.meetings["Make Move"].targets = validMoves;
  }
};

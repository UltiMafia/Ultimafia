const Card = require("../../Card");
const { PRIORITY_ITEM_TAKER_DEFAULT } = require("../../const/Priority");

module.exports = class GuessKira extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Guess Kira": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive", "dead"], exclude: ["self"] },
        action: {
          labels: ["stealItem"],
          priority: PRIORITY_ITEM_TAKER_DEFAULT,
          run: function () {
            if (this.target.hasItem("Notebook")) {
              this.stealItemByName("Notebook");
              this.target.queueAlert("Your notebook has been stolen!");
              return;
            } else {
              this.stealRandomItem();
            }
          },
        },
      },
    };

    this.listeners = {
      state: function () {
        if (!this.player.alive) return;

        if (this.game.getStateName() != "Day") return;

        this.player.sendAlert(
          `You have ${this.player.getItems("Notebook").length} notebooks!`
        );
      },
    };
  }
};

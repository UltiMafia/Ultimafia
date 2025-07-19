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
          role: this.role,
          run: function () {
            if (!this.role.data.guessed) {
              this.role.data.guessed = 0;
            }
            if (this.target.hasItem("Notebook")) {
              this.actor.queueAlert(
                `:journ: You determine that ${this.target.name} has your notebook!`
              );
              this.role.data.guessed++;
            }
          },
        },
      },
    };
  }
};

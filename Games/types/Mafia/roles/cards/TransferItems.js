const Card = require("../../Card");
const { PRIORITY_ITEM_TAKER_DEFAULT } = require("../../const/Priority");

module.exports = class TransferItems extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Steal From": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["dead", "self"] },
        action: {
          role: this.role,
          labels: ["stealItem"],
          priority: PRIORITY_ITEM_TAKER_DEFAULT - 1,
          run: function () {
            this.role.data.victim = this.target;
          },
        },
      },
      "Give To": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["dead", "self"] },
        action: {
          role: this.role,
          labels: ["stealItem"],
          priority: PRIORITY_ITEM_TAKER_DEFAULT,
          run: function () {
            if (
              typeof this.role.data.victim === "undefined" ||
              this.target.role.alignment === "Mafia"
            )
              return;

            this.stealAllItems(this.role.data.victim, this.target);
          },
        },
      },
    };
  }
};

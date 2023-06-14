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
          labels: ["stealItem"],
          priority: PRIORITY_ITEM_TAKER_DEFAULT - 1,
          run() {
            this.actor.role.data.victim = this.target;
          },
        },
      },
      "Give To": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["dead", "self"] },
        action: {
          labels: ["stealItem"],
          priority: PRIORITY_ITEM_TAKER_DEFAULT,
          run() {
            if (
              typeof this.actor.role.data.victim === "undefined" ||
              this.target.role.alignment === "Mafia"
            )
              return;

            this.stealAllItems(this.actor.role.data.victim, this.target);
          },
        },
      },
    };
  }
};

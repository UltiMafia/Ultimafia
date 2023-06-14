const Card = require("../../Card");
const { PRIORITY_ITEM_TAKER_DEFAULT } = require("../../const/Priority");
const Random = require("../../../../../lib/Random");

module.exports = class StealItem extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Steal From": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["dead", "self"] },
        action: {
          labels: ["stealItem"],
          priority: PRIORITY_ITEM_TAKER_DEFAULT,
          run() {
            this.stealRandomItem();
          },
        },
      },
    };
  }
};

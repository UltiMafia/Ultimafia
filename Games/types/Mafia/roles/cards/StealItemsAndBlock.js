const Card = require("../../Card");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class StealItemsAndBlock extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Steal From": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["dead", "self"] },
        action: {
          labels: ["stealItem"],
          priority: PRIORITY_NIGHT_ROLE_BLOCKER,
          run: function () {
            this.blockActions();
            this.stealAllItems();
          },
        },
      },
    };
  }
};

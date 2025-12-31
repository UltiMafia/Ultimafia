const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_EARLY } = require("../../const/Priority");

module.exports = class ShieldGiver extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Shield": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "shield"],
          priority: PRIORITY_ITEM_GIVER_EARLY,
          run: function () {
            this.target.holdItem("Shield");
            this.target.queueGetItemAlert("Shield");
          },
        },
      },
    };
  }
};

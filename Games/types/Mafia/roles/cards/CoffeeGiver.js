const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class CoffeeGiver extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Coffee": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "coffee"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.holdItem("Coffee");
            this.target.queueGetItemAlert("Coffee");
          },
        },
      },
    };
  }
};

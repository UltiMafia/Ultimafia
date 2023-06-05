const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class DouseInGasoline extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Douse Player": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "gasoline"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.holdItem("Gasoline");
          },
        },
      },
    };
  }
};

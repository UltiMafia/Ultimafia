const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveBread extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Bread (2)": {
        states: ["Night"],
        flags: ["voting", "multi"],
        multiMin: 2,
        multiMax: 2,
        action: {
          labels: ["giveItem", "bread"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.forEach((p) => {
              p.holdItem("Bread");
              p.queueGetItemAlert("Bread");
            });
          },
        },
      },
    };
  }
};

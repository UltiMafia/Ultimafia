const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class CandleGiver extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Candle": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "candle"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.holdItem("Candle");
            this.queueGetItemAlert("Candle");
          },
        },
      },
    };
  }
};

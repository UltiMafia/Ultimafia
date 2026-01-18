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
          role: this.role,
          labels: ["giveItem", "candle"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            let item = this.target.holdItem("Candle");
            this.target.queueGetItemAlert("Candle");

            item.inheritedModifiers = this.role.modifier.split("/");
          },
        },
      },
    };
  }
};

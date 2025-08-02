const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveFishingRod extends Card {
  constructor(role) {
    super(role);

    this.startItems = ["FishingRod"];

    this.meetings = {
      "Give Fishing Rod": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "fish"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.holdItem("FishingRod");
            this.target.queueGetItemAlert("FishingRod");
          },
        },
      },
    };
  }
};

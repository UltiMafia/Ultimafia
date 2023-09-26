const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class RingGiver extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Ring": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "ring"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.holdItem("EngagementRing");
            this.target.queueGetItemAlert("EngagementRing");
          },
        },
      },
    };
  }
};

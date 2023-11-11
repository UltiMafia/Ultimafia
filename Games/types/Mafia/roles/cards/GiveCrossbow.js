const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveCrossbow extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Crossbow": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "crossbow"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.holdItem("Crossbow");
            this.target.queueGetItemAlert("Crossbow");
          },
        },
      },
    };
  }
};

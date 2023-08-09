const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveWhiskey extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Whiskey": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "whiskey"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.holdItem("Whiskey");
            this.target.queueGetItemAlert("Whiskey");
          },
        },
      },
    };
  }
};

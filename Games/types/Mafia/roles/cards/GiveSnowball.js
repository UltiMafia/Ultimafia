const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveSnowball extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Snowball": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "snowball"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.holdItem("Snowball");
            this.target.queueGetItemAlert("Snowball");
          },
        },
      },
    };
  }
};

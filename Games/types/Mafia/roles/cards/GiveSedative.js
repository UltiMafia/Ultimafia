const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveSedative extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Snowball": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "sedative"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.holdItem("Sedative");
            this.target.queueGetItemAlert("Sedative");
          },
        },
      },
    };
  }
};

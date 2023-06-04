const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class KeyGiver extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Key": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "key"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.holdItem("Key");
            this.queueGetItemAlert("Key");
          },
        },
      },
    };
  }
};

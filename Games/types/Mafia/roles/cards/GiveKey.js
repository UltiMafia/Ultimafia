const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveKey extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Key": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["dead", "self"] },
        action: {
          labels: ["giveItem", "key"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.holdItem("Key");
            this.target.queueGetItemAlert("Key");
          },
        },
      },
    };
  }
};

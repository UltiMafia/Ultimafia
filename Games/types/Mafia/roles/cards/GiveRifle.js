const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveRifle extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Gun": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "rifle"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.holdItem("Rifle");
            this.target.queueGetItemAlert("Rifle");
          },
        },
      },
    };
  }
};

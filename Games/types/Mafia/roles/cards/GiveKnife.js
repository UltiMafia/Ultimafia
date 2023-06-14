const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveKnife extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Knife": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "knife"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run() {
            this.target.holdItem("Knife");
            this.queueGetItemAlert("Knife");
          },
        },
      },
    };
  }
};

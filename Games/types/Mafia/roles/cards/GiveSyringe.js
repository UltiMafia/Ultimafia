const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveSyringe extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Syringe": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "syringe"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.holdItem("Syringe");
            this.target.queueGetItemAlert("Syringe");
          },
        },
      },
    };
  }
};

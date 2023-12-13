const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveTract extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Tract": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "tract"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.holdItem("Tract");
            this.target.queueGetItemAlert("Tract");
          },
        },
      },
    };
  }
};

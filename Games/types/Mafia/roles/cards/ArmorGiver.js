const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class ArmorGiver extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Armor": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "armor"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.holdItem("Armor");
            this.queueGetItemAlert("Armor");
          },
        },
      },
    };
  }
};

const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_EARLY } = require("../../const/Priority");

module.exports = class GiveArmor extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Armor": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "armor"],
          priority:  PRIORITY_ITEM_GIVER_EARLY,
          run: function () {
            this.target.holdItem("Armor");
            this.target.queueGetItemAlert("Armor");
          },
        },
      },
    };
  }
};

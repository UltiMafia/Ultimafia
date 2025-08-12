const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_EARLY } = require("../../const/Priority");

module.exports = class GivePresents extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Present": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem"],
          role: this.role,
          priority: PRIORITY_ITEM_GIVER_EARLY,
          run: function () {
            let itemType = this.role.data.itemType;
            if (!itemType) {
              return;
            }

            this.target.holdItem(itemType);
            this.target.queueGetItemAlert(itemType);
            delete this.role.data.itemType;
          },
        },
      },
      "Choose Present": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "custom",
        targets: [
          "Gun",
          "Armor",
          "Bomb",
          "Knife",
          "Crystal",
          "Whiskey",
          "Bread",
          "Key",
          "Falcon",
          "Tract",
          "Envelope",
          "Syringe",
          "Coffee",
          "Shield",
        ],
        action: {
          role: this.role,
          priority: PRIORITY_ITEM_GIVER_EARLY - 1,
          run: function () {
            this.role.data.itemType = this.target;
          },
        },
      },
    };
  }
};

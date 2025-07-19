const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class CultWares extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Corrupted Item": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "broken"],
          role: this.role,
          priority: PRIORITY_ITEM_GIVER_DEFAULT - 1,
          run: function () {
            var itemType = this.role.data.itemType;
            if (!itemType) {
              return;
            }

            this.target.holdItem(itemType, { magicCult: true });
            this.target.queueGetItemAlert(itemType);
            delete this.role.data.itemType;
          },
        },
      },
      "Choose Corrupted Item": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "custom",
        targets: [
          "Gun",
          "Armor",
          "Knife",
          "Whiskey",
          "Bread",
          "Candle",
          "Falcon",
          "Tract",
          "Syringe",
          "Envelope",
          "Coffee",
          "Shield",
        ],
        action: {
          role: this.role,
          priority: PRIORITY_ITEM_GIVER_DEFAULT - 2,
          run: function () {
            this.role.data.itemType = this.target;
          },
        },
      },
    };
  }
};

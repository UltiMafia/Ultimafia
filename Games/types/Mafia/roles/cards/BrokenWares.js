const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_EARLY } = require("../../const/Priority");

module.exports = class BrokenWares extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Broken Item": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "broken"],
          priority: PRIORITY_ITEM_GIVER_EARLY - 1,
          run: function () {
            var itemType = this.actor.role.data.itemType;
            if (!itemType) {
              return;
            }

            this.target.holdItem(itemType, { broken: true });
            this.target.queueGetItemAlert(itemType);
            delete this.actor.role.data.itemType;
          },
        },
      },
      "Choose Broken Item": {
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
          priority: PRIORITY_ITEM_GIVER_EARLY - 2,
          run: function () {
            this.actor.role.data.itemType = this.target;
          },
        },
      },
    };
  }
};

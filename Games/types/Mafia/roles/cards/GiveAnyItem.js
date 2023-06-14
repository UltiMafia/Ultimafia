const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveAnyItem extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Item": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "cursed"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT - 1,
          run() {
            const { itemType } = this.actor.role.data;
            if (!itemType) return;

            const itemTypeSplit = itemType.split(" ");
            const isCursed = itemTypeSplit[0] == "Cursed";
            const itemName = itemTypeSplit[itemTypeSplit.length - 1];

            this.target.holdItem(itemName, { cursed: isCursed });
            this.queueGetItemAlert(itemName);
            delete this.actor.role.data.itemType;
          },
        },
      },
      "Choose Item": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "custom",
        targets: [
          "Gun",
          "Armor",
          "Knife",
          "Snowball",
          "Bread",
          "Cursed Gun",
          "Cursed Armor",
          "Cursed Knife",
          "Cursed Snowball",
          "Cursed Bread",
        ],
        action: {
          priority: PRIORITY_ITEM_GIVER_DEFAULT - 2,
          run() {
            this.actor.role.data.itemType = this.target;
          },
        },
      },
    };
  }
};

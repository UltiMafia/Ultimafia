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
          run: function () {
            var itemType = this.actor.role.data.itemType;
            if (!itemType) return;

            let itemTypeSplit = itemType.split(" ");
            let isCursed = itemTypeSplit[0] == "Cursed";
            let itemName = itemTypeSplit[itemTypeSplit.length - 1];

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
          run: function () {
            this.actor.role.data.itemType = this.target;
          },
        },
      },
    };
  }
};

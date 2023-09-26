const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class CursedWares extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Cursed Item": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "cursed"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT - 1,
          run: function () {
            var itemType = this.actor.role.data.itemType;
            if (!itemType) {
              return;
            }

            this.target.holdItem(itemType, { cursed: true });
            this.target.queueGetItemAlert(itemType);
            delete this.actor.role.data.itemType;
          },
        },
      },
      "Choose Cursed Item": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "custom",
        targets: ["Gun", "Armor", "Knife", "Whiskey", "Bread", "Crossbow"],
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

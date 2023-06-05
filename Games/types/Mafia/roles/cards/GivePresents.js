const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GivePresents extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Present": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            let itemType = this.actor.role.data.itemType;
            if (!itemType) {
              return;
            }

            this.target.holdItem(itemType);
            this.queueGetItemAlert(itemType);
            delete this.actor.role.data.itemType;
          },
        },
      },
      "Choose Present": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "custom",
        targets: ["Gun", "Armor", "Knife", "Crystal", "Snowball", "Bread"],
        action: {
          priority: PRIORITY_ITEM_GIVER_DEFAULT - 1,
          run: function () {
            this.actor.role.data.itemType = this.target;
          },
        },
      },
    };
  }
};

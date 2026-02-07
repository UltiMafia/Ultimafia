const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_EARLY } = require("../../const/Priority");

module.exports = class StartingItemGiver extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Items": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          role: this.role,
          labels: ["giveItem"],
          priority: PRIORITY_ITEM_GIVER_EARLY,
          run: function () {
            //this.target.holdItem("Bomb");
            //this.target.queueGetItemAlert("Bomb");
      for (let item of this.role.RemovedStartingItems) {
      let StartingItem;
      if (typeof item == "string") {
          StartingItem = this.target.holdItem(item);
        this.target.queueGetItemAlert(item);
      } else {
        const args = Array.isArray(item.args) ? item.args : [];
        StartingItem = this.target.holdItem(item.type, ...args);
        this.target.queueGetItemAlert(item.type);
      }
    }
          },
        },
      },
    };
  }
};

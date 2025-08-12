const Item = require("../Item");
const { PRIORITY_ITEM_GIVER_EARLY } = require("../const/Priority");

module.exports = class Doll extends Item {
  constructor(options) {
    super("Doll");

    this.meetings = {
      "Pass On Doll": {
        actionName: "Pass on the doll?",
        states: ["Night"],
        flags: ["voting", "mustAct"],
        item: this,
        action: {
          labels: ["giveItem", "doll", "absolute"],
          priority: PRIORITY_ITEM_GIVER_EARLY,
          item: this,
          run: function () {
            this.item.drop();
            this.target.holdItem("Doll");
            this.target.queueGetItemAlert("Doll");
          },
        },
      },
    };
  }
};

const Item = require("../Item");
const {
  PRIORITY_KILL_DEFAULT,
  PRIORITY_ITEM_GIVER_DEFAULT,
} = require("../const/Priority");

module.exports = class Notebook extends Item {
  constructor(options) {
    super("Notebook");

    this.meetings = {
      "Write Name": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT + 1,
          item: this,
          run: function () {
            if (this.dominates()) this.target.kill("basic", this.actor);
          },
        },
      },
      "Pass On Notebook": {
        actionName: "Pass on the Notebook?",
        states: ["Day"],
        flags: ["voting", "mustAct"],
        action: {
          labels: ["giveItem", "notebook", "absolute"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          item: this,
          run: function () {
            this.item.drop();
            this.target.holdItem("Notebook");
            this.target.queueGetItemAlert("Notebook");
          },
        },
      },
    };
  }
};

const Item = require("../Item");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../const/Priority");

module.exports = class Notebook extends Item {
  constructor(options) {
    super("Notebook");

    this.meetings = {
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

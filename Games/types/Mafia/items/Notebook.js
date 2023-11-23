const Item = require("../../Item");
const { PRIORITY_ITEM_GIVER_DEFAULT, PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class Notebook extends Item {
  constructor(role) {
    super(role);

    this.meetings = {
      "Write Name": {
        states: ["Night"],
        flags: ["voting", "noVeg"],
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
        states: ["Day"],
        flags: ["voting", "mustAct", "noVeg"],
        action: {
          labels: ["giveItem", "absolute"],
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

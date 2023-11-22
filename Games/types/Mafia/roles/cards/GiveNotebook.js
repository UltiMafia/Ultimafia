const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveNotebook extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Notebook": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "notebook"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.holdItem("Notebook");
            this.target.queueGetItemAlert("Notebook");
          },
        },
      },
    };
  }
};

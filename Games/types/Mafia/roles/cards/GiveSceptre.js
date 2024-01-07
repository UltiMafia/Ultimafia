const Card = require("../../Card");
const { PRIORITY_Item_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveSceptre extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Sceptre": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "sceptre"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.giveItem("Sceptre");
          },
        },
      },
    };
  }
};

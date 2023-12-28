const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveCrown extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Crown": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "crown"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.giveEffect("Crown");
            this.target.quereAlert("You have been chosen to wear the crown... You are king for a day!");
          },
        },
      },
    };
  }
};

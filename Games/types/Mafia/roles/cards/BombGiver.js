const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_EARLY } = require("../../const/Priority");

module.exports = class BombGiver extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Bomb": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "bomb"],
          priority: PRIORITY_ITEM_GIVER_EARLY,
          run: function () {
            this.target.holdItem("Bomb", 1);
            this.target.queueGetItemAlert("Bomb");
          },
        },
      },
    };
  }
};

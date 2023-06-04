const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class BombGiver extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Bomb": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "bomb"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.holdItem("Bomb", 1);
            this.queueGetItemAlert("Bomb");
          },
        },
      },
    };
  }
};

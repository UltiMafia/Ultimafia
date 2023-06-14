const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class TickingBombGiver extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Ticking Bomb": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"] },
        action: {
          labels: ["giveItem", "bomb"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run() {
            this.target.holdItem("TickingBomb", this.actor);
            this.queueGetItemAlert("TickingBomb");
          },
        },
      },
    };
  }
};

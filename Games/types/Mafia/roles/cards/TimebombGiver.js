const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class TimebombGiver extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Timebomb": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"] },
        action: {
          labels: ["giveItem", "bomb"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.holdItem("Timebomb", this.actor);
            this.target.queueGetItemAlert("Timebomb");
            this.game.queueAlert(`${this.target.name} has a timebomb!`);
          },
        },
      },
    };
  }
};

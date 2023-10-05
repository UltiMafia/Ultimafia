const Card = require("../../Card");
const { PRIORITY_ITEM_TAKER_DEFAULT } = require("../../const/Priority");

module.exports = class KeepHouse extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Housekeep: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          labels: ["clean", "stealItem"],
          priority: PRIORITY_ITEM_TAKER_DEFAULT,
          run: function () {
            this.actor.role.cleanedHouse = true;
            this.target.lastWill = null;
            this.stealAllItems();
          },
        },
        shouldMeet() {
          return !this.cleanedHouse;
        },
      },
    };
  }
};

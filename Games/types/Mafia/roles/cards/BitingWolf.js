const Card = require("../../Card");
const { PRIORITY_BITING_WOLF } = require("../../const/Priority");

module.exports = class BitingWolf extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Wolf Bite": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["Cult"] },
        action: {
          labels: ["wolfBite"],
          priority: PRIORITY_BITING_WOLF,
          run: function () {
            if (this.dominates()) {
              this.target.giveEffect("Lycan");
            }
          },
        },
      },
    };
  }
};

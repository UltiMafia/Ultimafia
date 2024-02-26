const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class HouseArrest extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "House Arrest": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self", isPrevTarget] },
        action: {
          labels: ["effect", "housearrest"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            this.actor.role.prevTarget = this.target;
            this.target.giveEffect("Housearrested", 1);
          },
        },
      },
    };
  }
};

function isPrevTarget(player) {
  return this.role && player == this.role.prevTarget;
}

const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class MakeCondemnImmune extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Protect from Condemn": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive", "self"], exclude: [isPrevTarget] },
        action: {
          labels: ["effect"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            this.actor.role.data.prevTarget = this.target;
            if (this.dominates()) {
              this.target.giveEffect("Condemn Immune", 5, 1);
            }
          },
        },
      },
    };
  }
};

function isPrevTarget(player) {
  return this.role && player == this.role.data.prevTarget;
}

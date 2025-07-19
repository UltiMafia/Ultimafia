const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class HouseArrest extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Place Under House Arrest": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self", isPrevTarget] },
        action: {
          labels: ["effect", "whistleblown"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          role: this.role,
          run: function () {
            this.role.prevTarget = this.target;
            this.target.giveEffect("Whistleblown", 1);
          },
        },
      },
    };
  }
};

function isPrevTarget(player) {
  return this.role && player == this.role.prevTarget;
}

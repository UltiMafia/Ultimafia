const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");
const MafiaRole = require("../../Role");

module.exports = class Blinder extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Blind: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          role: role,
          labels: ["effect", "blind"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            if (this.dominates()) {
              this.role.giveEffect(this.target, "Blind", 1);
            }
          },
        },
      },
    };
  }
};

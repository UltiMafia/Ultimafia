const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class Silencer extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Silence: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          role: role,
          labels: ["effect", "silence"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            if (this.dominates()) {
              this.role.giveEffect(this.target, "Silenced", 1);
            }
          },
        },
      },
    };
  }
};

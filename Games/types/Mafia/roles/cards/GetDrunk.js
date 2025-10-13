const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GetDrunk extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Get Drunk": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["Mafia"] },
        action: {
          role: role,
          labels: ["giveEffect", "alcoholic"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            if (this.dominates()) {
              this.role.giveEffect(this.target, "Alcoholic");
            }
          },
        },
      },
    };
  }
};

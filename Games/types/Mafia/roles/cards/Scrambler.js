const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class Scrambler extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Scrambler: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          role: role,
          labels: ["effect"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            this.role.giveEffect(this.target, "Scrambled", 1);
          },
        },
      },
    };
  }
};

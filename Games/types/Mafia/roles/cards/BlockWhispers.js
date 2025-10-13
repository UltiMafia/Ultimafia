const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class BlockWhispers extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Clog: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["Mafia"] },
        action: {
          role: role,
          labels: ["effect", "blind"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            if (this.dominates()) {
              this.role.giveEffect(this.target, "Block Whispers", 2);
            }
          },
        },
      },
    };
  }
};

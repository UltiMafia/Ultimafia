const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class Mindwarper extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Drive Insane": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"]},
        action: {
          labels: ["effect", "insanity"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            if (this.isInsane()) return;

            if (this.dominates()) {
              this.target.giveEffect("Insanity", 1);
            }
          },
        },
      },
    };
  }
};

const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class LearnRoleIfTargetIsFirstToVote extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Wrangle Player": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          labels: ["effect"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            if (this.dominates())
              this.target.giveEffect(
                "Wrangled",
                this.actor,
                1
              );
          },
        },
      },
    };
  }
};

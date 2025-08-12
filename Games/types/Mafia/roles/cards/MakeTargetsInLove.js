const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_EARLY } = require("../../const/Priority");

module.exports = class MakeTargetsInLove extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Spread Love": {
        actionName: "Spread Love (2)",
        states: ["Night"],
        flags: ["voting", "multi"],
        targets: { include: ["alive"], exclude: ["", "self"] },
        multiMin: 2,
        multiMax: 2,
        action: {
          role: this.role,
          priority: PRIORITY_EFFECT_GIVER_EARLY,
          run: function () {
            var targetA = this.target[0];
            var targetB = this.target[1];

            if (!targetA || !targetB) return;

            targetA.giveEffect("Lovesick", targetB);
            this.queueGetEffectAlert("Lovesick", targetA, targetB.name);

            targetB.giveEffect("Lovesick", targetA);
            this.queueGetEffectAlert("Lovesick", targetB, targetA.name);

            this.role.pairedLovers = [targetA, targetB];
          },
        },
        shouldMeet() {
          return !this.pairedLovers;
        },
      },
    };
  }
};

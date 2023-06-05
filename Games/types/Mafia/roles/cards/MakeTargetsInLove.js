const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

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
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            var targetA = this.target[0];
            var targetB = this.target[1];

            if (!targetA || !targetB) return;

            targetA.giveEffect("InLoveWith", targetB);
            this.queueGetEffectAlert("InLoveWith", targetA, targetB.name);

            targetB.giveEffect("InLoveWith", targetA);
            this.queueGetEffectAlert("InLoveWith", targetB, targetA.name);

            this.actor.role.pairedLovers = [targetA, targetB];
          },
        },
        shouldMeet() {
          return !this.pairedLovers;
        },
      },
    };
  }
};

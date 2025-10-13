const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class SaveTwoAndDeliriate extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Protect Players": {
        actionName: "Protect Players (2)",
        states: ["Night"],
        flags: ["voting", "multi"],
        targets: { include: ["alive"], exclude: ["", "self"] },
        multiMin: 2,
        multiMax: 2,
        action: {
          role: role,
          labels: ["save", "block"],
          priority: PRIORITY_NIGHT_ROLE_BLOCKER + 2,
          run: function () {
            var targetA = this.target[0];
            var targetB = this.target[1];

            if (!targetA || !targetB) return;

            this.heal(1, targetA);
            this.heal(1, targetB);

            if (Random.randInt(0, 1) == 0) {
              if (this.dominates(targetA)) {
                this.blockWithDelirium(targetA);
              }
            } else {
              if (this.dominates(targetB)) {
                this.blockWithDelirium(targetB);
              }
            }
          },
        },
      },
    };
  }
};

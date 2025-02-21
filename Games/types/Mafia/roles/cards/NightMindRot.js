const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class NightMindRot extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Rot: {
        actionName: "Rot Player",
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self", "dead"] },
        action: {
          labels: ["block"],
          priority: PRIORITY_NIGHT_ROLE_BLOCKER,
          run: function () {
            if (this.dominates()) {
              this.blockWithDelirium(this.target);
            }
          },
        },
      },
    };
  }
};

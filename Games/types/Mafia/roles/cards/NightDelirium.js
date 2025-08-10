const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class NightDelirium extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Rot: {
        actionName: "Make Delirious",
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self", "dead"] },
        action: {
          labels: ["block", "delirium"],
          priority: PRIORITY_NIGHT_ROLE_BLOCKER+1,
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

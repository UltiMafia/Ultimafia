const Card = require("../../Card");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class NightMindRot extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Gas: {
        actionName: "Rot Player",
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["Cult", "dead"] },
        action: {
          labels: ["effect", "block"],
          priority: PRIORITY_NIGHT_ROLE_BLOCKER-1,
          run: function () {
            if (this.dominates()) this.target.giveEffect("MindRot", this.actor);
          },
        },
      },
    };
  }
};

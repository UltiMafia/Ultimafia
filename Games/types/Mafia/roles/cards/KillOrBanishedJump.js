const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_KILL_SPECIAL } = require("../../const/Priority");

module.exports = class KillorBanishedJump extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Kill: {
        actionName: "Kill",
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive", "self"] },
        action: {
          labels: ["kill"],
          priority: PRIORITY_KILL_SPECIAL,
          role: this.role,
          run: function () {
            let savers = this.getVisitors(this.target, "save");
            let saversSelf = this.getVisitors(this.actor, "save");

            let isBanished = this.target.role.data.banished;
            if(this.target.hasEffect("Misregistration")){
              isBanished = this.target.getRoleAppearance().split(" (")[1] &&
        this.target.getRoleAppearance().split(" (")[1].includes("Banished");
            }

            if (
              savers.length == 0 &&
              isBanished &&
              !this.role.data.hasJumped
            ) {
              if (saversSelf.length == 0) {
                this.role.data.hasJumped = true;
                this.target.setRole(
                  `${this.role.name}:${this.role.modifier}`,
                  this.role.data
                );
                this.actor.kill("basic");
              }
              return;
            }

            if (this.dominates()) this.target.kill("basic", this.actor);
          },
        },
      },
    };
  }
};

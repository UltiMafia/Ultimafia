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
          run: function () {
            let savers = this.getVisitors(this.target, "save");
            let saversSelf = this.getVisitors(this.actor, "save");
            if (
              savers.length == 0 &&
              this.target.role.data.banished &&
              !this.actor.role.data.hasJumped
            ) {
              if (saversSelf.length == 0) {
                this.actor.role.data.hasJumped = true;
                this.target.setRole(
                  `${this.actor.role.name}:${this.actor.role.modifier}`,
                  this.actor.role.data
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

const Card = require("../../Card");
const { PRIORITY_MAFIA_KILL } = require("../../const/Priority");

module.exports = class KillTargetIfVisited extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Curse: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["kill", "curse"],
          priority: PRIORITY_MAFIA_KILL,
          run: function () {
            const visitors = this.getVisitors(this.target).filter(
              (e) => e.role.alignment !== this.actor.role.alignment
            );

            if (visitors.length > 0 && this.dominates()) {
              this.target.kill("basic");
            }
          },
        },
      },
    };
  }
};

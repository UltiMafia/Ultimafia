const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class KillTargetIfVisited extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Curse: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["kill", "curse"],
          priority: PRIORITY_KILL_DEFAULT,
          power: 2,
          run: function () {
            const visitors = this.getVisitors(this.target).filter(
              (p) => p.role.alignment !== this.actor.role.alignment
            );

            if (visitors.length > 0 && this.dominates()) {
              this.target.kill("curse", this.actor);
            }
          },
        },
      },
    };
  }
};

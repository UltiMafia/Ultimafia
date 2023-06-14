const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class KillVisitorsWhileDead extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT - 1,
        labels: ["kill", "hidden", "absolute"],
        run() {
          if (this.actor.alive) return;

          const { visitors } = this.actor.role.data;

          if (visitors) {
            for (const visitor of visitors)
              if (this.dominates(visitor)) visitor.kill("basic", this.actor);

            this.actor.role.data.visitors = [];
          }
        },
      },
    ];
  }
};

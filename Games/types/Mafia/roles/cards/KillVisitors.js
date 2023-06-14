const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class KillVisitors extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill", "hidden", "absolute"],
        run() {
          if (!this.actor.alive) return;

          if (this.game.getStateName() != "Night") return;

          const visitors = this.getVisitors();

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

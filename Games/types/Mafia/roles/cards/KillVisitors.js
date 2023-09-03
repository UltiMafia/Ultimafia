const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class KillVisitors extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill", "hidden", "absolute"],
        run: function () {
          if (!this.actor.alive) return;

          if (this.game.getStateName() != "Night") return;

          let visitors = this.getVisitors();

          for (let visitor of visitors)
            if (this.dominates(visitor)) visitor.kill("basic", this.actor);
        },
      },
    ];
  }
};

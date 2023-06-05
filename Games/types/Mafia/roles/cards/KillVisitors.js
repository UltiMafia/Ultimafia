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

          var visitors = this.actor.role.data.visitors;

          if (visitors) {
            for (let visitor of visitors)
              if (this.dominates(visitor)) visitor.kill("basic", this.actor);

            this.actor.role.data.visitors = [];
          }
        },
      },
    ];
  }
};

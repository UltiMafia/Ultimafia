const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class Weak extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill", "hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

          let visits = this.getVisits(this.actor);
          let differentAlignmentVisits = visits.filter(
            (v) => v.role.alignment != this.actor.role.alignment
          );
          if (
            differentAlignmentVisits.length > 0 &&
            this.dominates(this.actor)
          ) {
            this.actor.kill("basic", this.actor);
          }
        },
      },
    ];
  }
};

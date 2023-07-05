const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class Disloyal extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["block", "hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

          let visits = this.getVisits(this.actor);
          let sameAlignmentVisits = visits.filter(
            (v) => v.role.alignment == this.actor.role.alignment
          );
          if (sameAlignmentVisits.length > 0) {
            this.blockActions(this.actor);
          }
        },
      },
    ];
  }
};

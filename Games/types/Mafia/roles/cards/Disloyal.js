const Card = require("../../Card");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class Disloyal extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_NIGHT_ROLE_BLOCKER,
        labels: ["block", "hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Night") return;
          if (
            this.actor.getMeetingByName("Mafia") ||
            this.actor.getMeetingByName("Cultists")
          )
            return;
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

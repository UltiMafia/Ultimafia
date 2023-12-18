const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class Reckless extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["investigate", "role", "hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

          let targets = this.getVisits(this.actor);
          let targetRoles = targets.map((t) => t.getRoleAppearance());
          let targetAlignments = targetRoles.map((r) => this.game.getRoleAlignment(r));
          
        },
      },
    ];
  }
};

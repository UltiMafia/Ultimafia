const Card = require("../../Card");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class Complex extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_NIGHT_ROLE_BLOCKER,
        labels: ["block", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

          const vanillaVisits = this.getVisits(this.actor).filter((p) =>
            this.isVanillaRole(p)
          );
          if (vanillaVisits.length > 0) {
            this.blockActions(this.actor);
          }
        },
      },
    ];
  }
};

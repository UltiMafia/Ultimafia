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

          if (this.actor.getMeetingByName("Mafia", "Night") || this.actor.getMeetingByName("Cultists", "Night")) return;

          if (!this.actor.alive) return;

          if (this.isVanillaRole(this.actor) === true) {
            this.blockActions(this.actor);
          }
        },
      },
    ];
  }
};

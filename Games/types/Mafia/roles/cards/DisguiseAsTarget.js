const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class DisguiseAsTarget extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate", "role", "hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

          let targets = this.getVisits(this.actor);
          let finalTarget = targets[targets.length-1];
          let role = finalTarget.getAppearance("investigate", true);
          let alert = `:mask: After studying ${finalTarget.name}, you learn to act like a ${role}.`;
          this.actor.holdItem("Suit", role);
        },
      },
    ];
  }
};

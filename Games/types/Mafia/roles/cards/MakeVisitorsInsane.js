const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class MakeVisitorsInsane extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_EFFECT_GIVER_DEFAULT,
        labels: ["hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() !== "Night") {
            return;
          }

          let visitors = this.getVisitors();
          for (let visitor of visitors) {
            if (visitor.role.name === "Insane Cop") continue;
            visitor.giveEffect("Insanity");
            visitor.queueAlert(
              ":sy3f: Reality fades as your mind is consumed by insanity."
            );
          }
        },
      },
    ];
  }
};

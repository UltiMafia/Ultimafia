const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class MakeVisitorsInsane extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_EFFECT_GIVER_DEFAULT,
        labels: ["hidden", "absolute"],
        run() {
          if (this.game.getStateName() !== "Night") {
            return;
          }

          const visitors = this.getVisitors();
          for (const visitor of visitors) {
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

const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class LearnVisitorsPerson extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate", "role", "hidden", "absolute"],
        run() {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

          const visitors = this.getVisitors(this.actor);
          let visitorNames = visitors.map((v) => v.name);
          if (visitors.length === 0) {
            visitorNames = ["no one"];
          }

          this.actor.queueAlert(
            `:sy0f: You were visited by ${visitorNames.join(
              ", "
            )} during the night.`
          );
        },
      },
    ];
  }
};

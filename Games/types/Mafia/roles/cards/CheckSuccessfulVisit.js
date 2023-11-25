const Card = require("../../Card");
const {
  PRIORITY_INVESTIGATIVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class CheckSuccessfulVisit extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          let targets = this.getVisits(this.actor);
          let targetNames = targets.map((t) => t.name);

          if (targetNames.length >= 1) {
            this.actor.queueAlert(`:invest: You learn that your visit to ${targetNames.join(", ")} was successful.`);
          }
        },
      },
    ];
  }
};

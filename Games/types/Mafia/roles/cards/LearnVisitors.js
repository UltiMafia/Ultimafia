const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class LearnVisitors extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate", "role", "hidden", "absolute"],
        run() {
          if (this.game.getStateName() != "Night") return;

          for (const action of this.game.actions[0]) {
            if (action.target == this.actor && !action.hasLabel("hidden")) {
              const role = action.actor.getAppearance("investigate", true);
              const alert = `:sy0d: You learn that ${action.actor.name}'s role is ${role}.`;
              this.actor.queueAlert(alert);
            }
          }
        },
      },
    ];
  }
};

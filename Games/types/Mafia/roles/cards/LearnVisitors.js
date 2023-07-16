const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class LearnVisitors extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate", "role", "hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          for (let action of this.game.actions[0]) {
            if (action.target == this.actor && !action.hasLabel("hidden")) {
              var role = action.actor.getAppearance("investigate", true);
              var alert = `:invest: You learn that ${action.actor.name}'s role is ${role}.`;
              this.actor.queueAlert(alert);
            }
          }
        },
      },
    ];
  }
};

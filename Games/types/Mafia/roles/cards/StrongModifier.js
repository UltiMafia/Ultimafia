const Card = require("../../Card");
const { PRIORITY_MODIFY_ACTION_LABELS } = require("../../const/Priority");

module.exports = class StrongModifier extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_MODIFY_ACTION_LABELS,
        run: function () {
          for (let action of this.game.actions[0]) {
            if (action.actors.includes(this.actor) && action.hasLabel("kill")) {
              action.power = Infinity;
              action.labels = [...action.labels, "absolute", "strong"];
              action.target.removeEffect("Extra Life", true);
            }
          }
        },
      },
    ];
  }
};

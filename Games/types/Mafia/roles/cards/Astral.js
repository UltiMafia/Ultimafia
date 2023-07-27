const Card = require("../../Card");
const { PRIORITY_MODIFY_ACTION_LABELS } = require("../../const/Priority");

module.exports = class Astral extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_MODIFY_ACTION_LABELS,
        labels: ["absolute", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          for (let action of this.game.actions[0]) {
            if (
              action.priority > this.priority &&
              action.actors.includes(this.actor)
            ) {
              action.labels = [...action.labels, "hidden"];
            }
          }
        },
      },
    ];
  }
};

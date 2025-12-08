const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_MODIFY_ACTION_LABELS } = require("../../const/Priority");

module.exports = class Resolute extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Modifier"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_MODIFY_ACTION_LABELS,
        labels: ["absolute", "hidden"],
        run: function () {
          for (let action of this.game.actions[0]) {
            if (action.actors.includes(this.actor)) {
              action.labels = [...action.labels, "absolute"];
            }
          }
        },
      },
    ];
  }
};

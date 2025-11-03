const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_MODIFY_ACTION_LABELS } = require("../../const/Priority");

module.exports = class Astral extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Modifier", "WhenDead"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_MODIFY_ACTION_LABELS,
        labels: ["absolute", "hidden"],
        role: role,
        run: function () {
          for (let action of this.game.actions[0]) {
            if (
              action.priority > this.priority &&
              action.actors.includes(this.actor) &&
              !action.hasLabels(["mafia"])
            ) {
              action.labels = [...action.labels, "hidden"];
            }
          }
        },
      },
    ];
  }
};

const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_MODIFY_ACTION_LABELS } = require("../../const/Priority");

module.exports = class Astral extends Card {
  constructor(role) {
    super(role);
    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_MODIFY_ACTION_LABELS,
          labels: ["absolute", "hidden"],
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
        });
        this.game.queueAction(action);
      },
    };
  }
};

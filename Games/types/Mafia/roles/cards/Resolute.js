const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_MODIFY_ACTION_LABELS } = require("../../const/Priority");

module.exports = class Resolute extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_MODIFY_ACTION_LABELS,
        labels: ["absolute", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          for (let action of this.game.actions[0]) {
            if (action.actors.includes(this.actor)) {
              action.labels = [...action.labels, "absolute"];
            }
          }
        },
      },
    ];
*/

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Modifier"])) {
          return;
        }

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
              if (action.actors.includes(this.actor)) {
                action.labels = [...action.labels, "absolute"];
              }
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};

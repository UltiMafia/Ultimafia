const Card = require("../../Card");
const Action = require("../../Action");
const Player = require("../../Player");
const { PRIORITY_MODIFY_ACTION_LABELS } = require("../../const/Priority");

module.exports = class StrongModifier extends Card {
  constructor(role) {
    super(role);
    /*
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
*/

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Strong", "Modifier"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_MODIFY_ACTION_LABELS,
          run: function () {
            for (let action of this.game.actions[0]) {
              if (
                action.actors.includes(this.actor) &&
                action.hasLabel("kill")
              ) {
                action.power = Infinity;
                action.labels = [...action.labels, "absolute", "strong"];
                if (action.target && action.target instanceof Player) {
                  action.target.removeEffect("Extra Life", true);
                }
              }
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};

const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_MODIFY_ACTION_DELAY } = require("../../const/Priority");

module.exports = class ModifierLazy extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        labels: ["delayAction"],
        priority: PRIORITY_MODIFY_ACTION_DELAY,
        run: function () {
          if (this.game.getStateName() != "Night") return;

          for (let action of this.game.actions[0]) {
            if (action.actors.includes(this.actor)) {
              this.game.dequeueAction(action, true);
              action.delay = 1;
              this.game.queueAction(action);
            }
          }
        },
      },
    ];
*/

    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          labels: ["delayAction"],
          priority: PRIORITY_MODIFY_ACTION_DELAY,
          run: function () {
            for (let action of this.game.actions[0]) {
              if (
                action.actors.includes(this.actor) &&
                !action.hasLabel("delayAction")
              ) {
                //let newAction = action;
                action.cancel(true);
                this.game.dequeueAction(action, true);
                //newAction.delay = 1;
                //newAction.labels.push("delayAction");

                action.delay = 1;
                action.labels.push("delayAction");
                this.game.queueAction(newAction);
              }
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};

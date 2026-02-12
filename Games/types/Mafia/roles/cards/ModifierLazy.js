const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_MODIFY_ACTION_DELAY } = require("../../const/Priority");

module.exports = class ModifierLazy extends Card {
  constructor(role) {
    super(role);
    this.passiveActions = [
      {
        ability: ["Blocking", "Modifier", "WhenDead"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_MODIFY_ACTION_DELAY,
        labels: ["delayAction"],
        role: role,
        run: function () {
          if (this.dominates(this.actor)) {
            for (let action of this.game.actions[0]) {
              if (action.hasLabel("mafia")) {
                continue;
              }
              if (action.hasLabel("primary")) {
                continue;
              }
              if (action.hasLabel("delayAction")) {
                continue;
              }
              if (action.priority <= this.priority) {
                continue;
              }
              if (action.delay >= 1) {
                continue;
              }
              if (action.actor == this.actor) {
                this.game.dequeueAction(action, true);
                action.delay = 1;
                this.game.queueAction(action);
              }
            }
          }
          /*
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
                this.game.queueAction(action);
              }
            }
            */
        },
      },
    ];
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
    /*
    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Delay", "Modifier"])) {
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
            if (this.dominates(this.actor)) {
              for (let action of this.game.actions[0]) {
                if (action.hasLabel("mafia")) {
                  continue;
                }
                if (action.hasLabel("delayAction")) {
                  continue;
                }
                if (action.delay >= 1) {
                  continue;
                }
                if (action.actor === this.actor) {
                  this.game.dequeueAction(action, true);
                  action.delay = 1;
                  this.game.queueAction(action);
                }
              }
            }
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
                this.game.queueAction(action);
              }
            }
          },
        });

        this.game.queueAction(action);
      },
    };
    */
  }
};

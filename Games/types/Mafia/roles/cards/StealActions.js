const Card = require("../../Card");
const { PRIORITY_STEAL_ACTIONS } = require("../../const/Priority");
const Action = require("../../Action");
const Player = require("../../Player");

module.exports = class StealActions extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Monkey See": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_STEAL_ACTIONS,
          run: function () {
            this.actor.role.data.targetActionsToSteal = this.target;
          },
        },
      },
      "Monkey Do": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_STEAL_ACTIONS + 1,
          run: function () {
            if (!this.actor.role.data.targetActionsToSteal) {
              return;
            }
            let hasStolenAction = false;
            for (const action of this.game.actions[0]) {
              if (
                action.priority > this.priority &&
                action.actor === this.actor.role.data.targetActionsToSteal
              ) {
                const newAction = new Action({
                  ...action,
                  actor: this.actor,
                  target:
                    action.target instanceof Player
                      ? this.target
                      : action.target,
                  run: action.unboundRun,
                });
                this.game.queueAction(newAction, true);
                hasStolenAction = true;
              }
            }
            if (hasStolenAction) {
              this.actor.role.stealListeners(
                this.actor.role.data.targetActionsToSteal
              );
            }
            this.actor.role.data.targetActionsToSteal = null;
          },
        },
      },
    };
  }
};
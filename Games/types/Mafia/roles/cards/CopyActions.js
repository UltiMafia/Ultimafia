const Card = require("../../Card");
const { PRIORITY_COPY_ACTIONS } = require("../../const/Priority");
const Action = require("../../Action");
const Player = require("../../Player");

module.exports = class CopyActions extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Copy: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_COPY_ACTIONS,
          run: function () {
            this.actor.role.data.targetActionsToCopy = this.target;
          },
        },
      },
      Imitate: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_COPY_ACTIONS + 1,
          run: function () {
            if (!this.actor.role.data.targetActionsToCopy) {
              return;
            }
            let hasStolenAction = false;
            for (const action of this.game.actions[0]) {
              if (
                action.priority > this.priority &&
                action.actor === this.actor.role.data.targetActionsToCopy
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
              this.actor.role.copyListeners(
                this.actor.role.data.targetActionsToCopy
              );
            }
            this.actor.role.data.targetActionsToCopy = null;
          },
        },
      },
    };
  }
};

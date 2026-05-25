const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_COPY_ACTIONS,
} = require("../../const/Priority");

function actionTargetsPlayer(action, player) {
  if (!action.target) {
    return false;
  }

  if (Array.isArray(action.target)) {
    return action.target.includes(player);
  }

  return action.target === player;
}

module.exports = class SurvivorHide extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Hide: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_COPY_ACTIONS,
          run: function () {
            this.role.hideBehind = this.target;
          },
        },
      },
    };

    this.actions = [
      {
        priority: PRIORITY_COPY_ACTIONS + 1,
        run: function () {
          const hideBehind = this.actor.role.hideBehind;
          if (!hideBehind) {
            return;
          }

          this.makeUntargetable(this.actor);

          for (const action of this.game.actions[0]) {
            if (
              action.priority <= this.priority ||
              action.cancelled ||
              !actionTargetsPlayer(action, hideBehind)
            ) {
              continue;
            }

            const newAction = new Action({
              ...action,
              target: this.actor,
              run: action.unboundRun,
            });
            this.game.queueAction(newAction, true);
          }
        },
      },
    ];

    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }

        if (stateInfo.name.match(/Day/)) {
          delete this.hideBehind;
        }
      },
    };
  }
};

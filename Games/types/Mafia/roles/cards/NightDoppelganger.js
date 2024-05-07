const Card = require("../../Card");
const {
  PRIORITY_COPY_ACTIONS,
  PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
  PRIORITY_WIN_CHECK_DEFAULT,
} = require("../../const/Priority");
const Action = require("../../Action");
const Player = require("../../Player");

module.exports = class NightDoppelganger extends Card {
  constructor(role) {
    super(role);

    role.allied = false;

    this.meetings = {
      "Choose Ally": {
        actionName: "Supplant",
        states: ["Night"],
        flags: ["voting", "mustAct"],
        shouldMeet() {
          return !this.allied;
        },
        action: {
          priority: PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
          run: function () {
            let ally = this.target
            let alignment = this.target.role.alignment;
            if (alignment == "Independent") {
              alignment = this.target.role.name;
              return;
            }

            this.actor.data.ally = ally;
            this.actor.role.data.alignment = alignment;
            this.actor.role.allied = true;
            this.actor.queueAlert(
              `You decide to supplant ${ally.name} and will win in their place.`
            );
          },
        },
      },
      "Imitate On": {
        states: ["Night"],
        flags: ["voting"],
        shouldMeet() {
          return this.allied;
        },
        action: {
          priority: PRIORITY_COPY_ACTIONS + 1,
          run: function () {
            if (!this.actor.data.ally) {
              return;
            }
            let hasStolenAction = false;
            for (const action of this.game.actions[0]) {
              if (
                action.priority > this.priority &&
                action.actor === this.actor.data.ally
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
                this.actor.data.ally
              );
            }
            this.actor.data.ally = null;
          },
        },
      },
    };
    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (!this.player.alive || !this.data.alignment) {
          return;
        }

        if (
          confirmedFinished &&
          winners.groups[this.data.alignment] &&
          !winners.groups[this.name]
        ) {
          winners.addPlayer(this.player, this.name);
          winners.removeGroup(this.data.alignment);
        }

        if (
          aliveCount <= 2 &&
          this.data.alignment != "Village" &&
          !winners.groups[this.name]
        ) {
          winners.addPlayer(this.player, this.name);
          winners.removeGroup(this.data.alignment);
        }
      },
    };
  }
};

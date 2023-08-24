const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_NIGHT_SAVER,
  PRIORITY_DAY_DEFAULT,
} = require("../../const/Priority");

module.exports = class GuardianAngel extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        const alivePlayers = this.game.players.filter(
          (p) => p.alive && p != this.player
        );
        this.angelTarget = Random.randArrayVal(alivePlayers);
        this.player.queueAlert(
          `You must protect ${this.angelTarget.name} with your life.`
        );
      },
      state: function () {
        if (this.game.getStateName() == "Night") {
          this.protectingTarget = false;
        }
      },
      immune: function (action, player) {
        if (!this.protectingTarget) {
          return;
        }

        if (player != this.angelTarget) {
          return;
        }

        if (action.hasLabel("kill") || action.hasLabel("condemn")) {
          // absolute death
          if (!this.player.alive) {
            this.game.queueAlert(
              `${this.angelTarget.name} was saved by their guardian angel.`
            );
          }
          this.player.kill("sacrifice", action.actor, true)
          this.immortalEffect.remove();
        }
      },
    };

    this.meetings = {
      Guardian: {
        states: ["Night"],
        flags: ["voting"],
        inputType: "boolean",
        whileDead: true,
        shouldMeet: function () {
          return !this.protectedTarget;
        },
        action: {
          labels: ["save", "guardian", "hidden", "absolute"],
          priority: PRIORITY_NIGHT_SAVER,
          run: function () {
            if (this.target == "No") return;

            this.actor.role.protectedTarget = true;
            this.actor.role.protectingTarget = true;

            const angelTarget = this.actor.role.angelTarget;
            // power 5, lifespan 2
            this.actor.role.immortalEffect = angelTarget.giveEffect(
              "Immortal",
              5,
              2
            );
          },
        },
      },
    };
  }
};

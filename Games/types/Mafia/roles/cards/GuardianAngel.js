const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_NIGHT_SAVER, PRIORITY_DAY_DEFAULT } = require("../../const/Priority");

module.exports = class GuardianAngel extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        const alivePlayers = this.game.players.filter(p => p.alive && p != this.player);
        this.angelTarget = Random.randArrayVal(alivePlayers);
        this.player.queueAlert(
          `You must protect ${this.angelTarget.name} with your life.`
        );
      },
      state: function() {
        if (this.game.getStateName() == "Night") {
          this.protectingTarget = false;
        }
      },
      immune: function(action, player) {
        if (!this.protectingTarget) {
          return;
        }

        if (player != this.angelTarget) {
          return;
        }

        if (action.hasLabel("kill") || action.hasLabel("condemn")) {
          // absolute death
          this.player.kill("angel", this.player);
          this.condemnImmuneEffect.remove();
        }
      }
    };

    this.meetings = {
      Guardian: {
        states: ["Night"],
        flags: ["voting"],
        inputType: "boolean",
        shouldMeet: function () {
          return !this.protectedTarget;
        },
        action: {
          labels: ["save", "guardian", "hidden", "absolute"],
          priority: PRIORITY_NIGHT_SAVER,
          run: function () {
            this.actor.role.protectedTarget = true;
            this.actor.role.protectingTarget = true;

            const angelTarget = this.actor.role.angelTarget;
            // power 5, lifespan 2
            this.actor.role.killImmuneEffect = angelTarget.giveEffect("KillImmune", 5, 2);
            this.actor.role.condemnImmuneEffect = angelTarget.giveEffect("CondemnImmune", 5, 2);
          },
        },
      },
    };
    
    // remove kill immune before village condemn
    this.actions = [
      {
        priority: PRIORITY_DAY_DEFAULT - 1,
        labels: ["absolute", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Day") return;

          this.actor.role.killImmuneEffect.remove();
        },
      },
    ];
  }
};

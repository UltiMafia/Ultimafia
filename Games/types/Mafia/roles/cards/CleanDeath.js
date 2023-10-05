const Card = require("../../Card");
const { PRIORITY_CLEAN_DEATH } = require("../../const/Priority");

module.exports = class CleanDeath extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Clean Death": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          labels: ["clean"],
          priority: PRIORITY_CLEAN_DEATH,
          run: function () {
            if (this.target == "No") return;

            var mafiaTarget;
            for (let action of this.game.actions[0]) {
              if (action.hasLabels(["kill", "mafia"])) {
                mafiaTarget = action.target;
                break;
              }
            }
            if (!mafiaTarget) return;

            const roleName = mafiaTarget.getRoleAppearance("death");
            this.actor.role.lastCleanedAppearance = roleName;
            mafiaTarget.role.appearance.death = null;
            this.actor.role.lastCleanedWill = mafiaTarget.lastWill;
            mafiaTarget.lastWill = null;

            this.actor.role.cleanedPlayer = mafiaTarget;
          },
        },
        shouldMeet() {
          return !this.cleanedPlayer;
        },
      },
    };
    this.listeners = {
      state: function () {
        if (this.game.getStateName() != "Day") return;

        const cleanedPlayer = this.cleanedPlayer;
        if (!cleanedPlayer) return;
        const lastCleanedAppearance = this.player.role.lastCleanedAppearance;
        if (!lastCleanedAppearance) return;

        if (!cleanedPlayer.alive) {
          this.player.sendAlert(
            `:mop: You discover ${cleanedPlayer.name}'s role is ${lastCleanedAppearance}.`
          );
        }

        cleanedPlayer.role.appearance.death = lastCleanedAppearance;
        cleanedPlayer.lastWill = this.player.role.lastCleanedWill;
        this.player.role.lastCleanedAppearance = null;
      },
    };
  }
};

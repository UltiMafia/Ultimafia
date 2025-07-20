const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
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
          role: this.role,
          run: function () {
            if (this.target == "No") return;

            var mafiaTarget;
            for (let action of this.game.actions[0]) {
              if (action.hasLabels(["kill", "mafia"])) {
                mafiaTarget = action.target;
                if (!action.dominates(mafiaTarget)) {
                  return;
                }
                break;
              }
            }
            if (!mafiaTarget) return;

            let info = this.game.createInformation(
              "RoleInfo",
              this.actor,
              this.game,
              mafiaTarget,
              "death"
            );
            info.processInfo();
            var alert = `:mop: You discover ${
              mafiaTarget.name
            }'s role is ${info.getInfoRaw()}.`;
            this.actor.queueAlert(alert);

            const roleName = mafiaTarget.getRoleAppearance("death");
            this.role.lastCleanedAppearance = roleName;
            mafiaTarget.role.appearance.death = null;
            this.role.lastCleanedWill = mafiaTarget.lastWill;
            mafiaTarget.lastWill = null;

            this.role.cleanedPlayer = mafiaTarget;
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
        const lastCleanedAppearance = this.lastCleanedAppearance;
        if (!lastCleanedAppearance) return;
        /*
        if (!cleanedPlayer.alive) {
          if (this.player.hasEffect("FalseMode")) {
            let wrongPlayers = this.game
              .alivePlayers()
              .filter(
                (p) =>
                  p.getRoleAppearance().split(" (")[0] !=
                  cleanedPlayer.role.name
              );
            let wrongRole =
              Random.randArrayVal(wrongPlayers).getRoleAppearance();
            this.player.queueAlert(
              `:mop: You discover ${cleanedPlayer.name}'s role is ${wrongRole}.`
            );
          } else {
            this.player.sendAlert(
              `:mop: You discover ${cleanedPlayer.name}'s role is ${lastCleanedAppearance}.`
            );
          }
        }
*/
        cleanedPlayer.role.appearance.death = lastCleanedAppearance;
        cleanedPlayer.lastWill = this.lastCleanedWill;
        this.lastCleanedAppearance = null;
      },
    };
  }
};

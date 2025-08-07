const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_SUNSET_DEFAULT } = require("../../const/Priority");

module.exports = class CleanCondemnation extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Clean Condemnation": {
        states: ["Dusk"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          role: this.role,
          labels: ["clean"],
          priority: PRIORITY_SUNSET_DEFAULT,
          run: function () {
            if (this.target == "No") return;
            if (!this.role.hasAbility(["Clean"])) {
              this.role.cleanedPlayer = 0;
              return;
            }
            var condemnedTarget;
            for (let action of this.game.actions[0]) {
              if (action.hasLabel("condemn")) {
                condemnedTarget = action.target;
                if (!action.dominates(condemnedTarget)) {
                  return;
                }
                break;
              }
            }
            if (!condemnedTarget) return;

            let info = this.game.createInformation(
              "RoleInfo",
              this.actor,
              this.game,
              condemnedTarget,
              "condemn"
            );
            info.processInfo();
            var alert = `:mop: You discover ${
              condemnedTarget.name
            }'s role is ${info.getInfoRaw()}.`;
            this.actor.queueAlert(alert);

            const roleName = condemnedTarget.getRoleAppearance("condemn");
            this.role.lastCleanedAppearance = roleName;
            condemnedTarget.role.appearance.condemn = null;
            this.role.lastCleanedWill = condemnedTarget.lastWill;
            condemnedTarget.lastWill = null;

            this.role.cleanedPlayer = condemnedTarget;
          },
        },
        shouldMeet() {
          return !this.cleanedPlayer;
        },
      },
    };
    this.listeners = {
      state: function () {
        if (this.game.getStateName() != "Night") return;

        const cleanedPlayer = this.cleanedPlayer;
        if (!cleanedPlayer || cleanedPlayer == 0) return;
        const lastCleanedAppearance = this.player.role.lastCleanedAppearance;
        if (!lastCleanedAppearance) return;
        /*
        if (!cleanedPlayer.alive) {
          if (this.player.hasEffect("FalseMode")) {
            let wrongPlayers = this.game
              .alivePlayers()
              .filter(
                (p) =>
                  p.getRoleAppearance("condemn").split(" (")[0] !=
                  cleanedPlayer.role.name
              );
            let wrongRole =
              Random.randArrayVal(wrongPlayers).getRoleAppearance("condemn");
            this.player.queueAlert(
              `:mop: You discover ${cleanedPlayer.name}'s role is ${wrongRole}.`
            );
          } else {
            this.player.queueAlert(
              `:mop: You discover ${cleanedPlayer.name}'s role is ${lastCleanedAppearance}.`
            );
          }
        }
*/
        cleanedPlayer.role.appearance.death = lastCleanedAppearance;
        cleanedPlayer.lastWill = this.player.role.lastCleanedWill;
        this.player.role.lastCleanedAppearance = null;
      },
    };
    this.stateMods = {
      Day: {
        type: "delayActions",
        delayActions: true,
      },
      /*
      Overturn: {
        type: "delayActions",
        delayActions: true,
      },
      Court: {
        type: "delayActions",
        delayActions: true,
      },
      Sunset: {
        type: "add",
        index: 6,
        length: 1000 * 30,
        shouldSkip: function () {
          return this.cleanedPlayer;
        },
      },
      */
    };
  }
};

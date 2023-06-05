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

            for (let action of this.game.actions[0]) {
              if (action.hasLabels(["kill", "mafia"]) && action.dominates()) {
                var targetRole = action.target.role;
                var actorRole = this.actor.role;

                if (!targetRole.data.lastCleanedAppearance) {
                  var roleName = action.target.getAppearance("death", true);
                  this.actor.queueAlert(
                    `:sy6b: You discover ${action.target.name}'s role is ${roleName}.`
                  );

                  actorRole.data.cleanedPlayer = action.target;
                  targetRole.data.lastCleanedAppearance =
                    targetRole.appearance.death;
                  targetRole.appearance.death = null;
                  action.target.lastWill = null;
                }

                break;
              }
            }
          },
        },
        shouldMeet() {
          return !this.data.cleanedPlayer;
        },
      },
    };
    this.listeners = {
      state: function (stateInfo) {
        var target = this.data.cleanedPlayer;

        if (
          stateInfo.name.match(/Day/) &&
          target &&
          target.role.data.lastCleanedAppearance
        ) {
          target.role.appearance.death = target.role.data.lastCleanedAppearance;
          target.role.data.lastCleanedAppearance = null;
        }
      },
    };
  }
};

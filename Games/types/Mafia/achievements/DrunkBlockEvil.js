const Achievements = require("../Achievements");
const Action = require("../Action");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../const/Priority");

module.exports = class DrunkBlockEvil extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        if (this.player.role.name == "Drunk" && !this.BlockedEvil) {
          var action = new Action({
            actor: null,
            target: this.player,
            game: this.player.game,
            priority: PRIORITY_NIGHT_ROLE_BLOCKER + 1,
            labels: ["hidden", "absolute"],
            achievement: this,
            run: function () {
              let blockedTarget = null;
              for (let action of this.game.actions[0]) {
                if (
                  action.hasLabels(["block"]) &&
                  !action.hasLabel("hidden") &&
                  action.actor == this.target &&
                  action.dominates(action.target, false)
                ) {
                  blockedTarget = action.target;
                  break;
                }
              }
              if (!blockedTarget) {
                return;
              }
              if (!blockedTarget.isEvil(true)) {
                return;
              }
              if (blockedTarget.role.name == "Villager") {
                return;
              }
              for (let action of this.game.actions[0]) {
                if (
                  action.actor == blockedTarget &&
                  action.target == this.target
                ) {
                  this.achievement.BlockedEvil = true;
                  break;
                }
              }
            },
          });

          this.game.queueAction(action);
        }
      },
      aboutToFinish: function () {
        if (this.BlockedEvil == true) {
          this.player.EarnedAchievements.push("Mafia50");
        }
      },
    };
  }
};

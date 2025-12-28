const Achievements = require("../Achievements");
const Action = require("../Action");
const { PRIORITY_CONVERT_DEFAULT } = require("../const/Priority");

module.exports = class ShrinkSaveTwice extends Achievements {
  constructor(name, player) {
    super(name, player);
    this.SavedCount = 0;
    this.listeners = {
      immune: function (action) {
        if (this.SavedPlayer && action.target !== this.SavedPlayer) {
          return;
        }

        if (!action.hasLabel("convert")) {
          return;
        }

        this.SavedCount++;
      },
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Day/)) {
          this.SavedPlayer = null;
        }
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        if (this.player.role.name == "Shrink" && this.SavedCount <= 0) {
          var action = new Action({
            actor: null,
            target: this.player,
            game: this.player.game,
            priority: PRIORITY_CONVERT_DEFAULT + 2,
            labels: ["hidden", "absolute"],
            achievement: this,
            run: function () {
              let temp;
              for (let action of this.game.actions[0]) {
                if (
                  action.hasLabels(["convert blocker"]) &&
                  action.actor == this.target
                ) {
                  if (!action.target.isEvil(true)) {
                    this.achievement.SavedPlayer = action.target;
                  }
                  break;
                }
              }
              /*
              if (temp == null) {
                return;
              }
              for (let action of this.game.actions[0]) {
                if (
                  action.hasLabels(["convert"]) &&
                  action.target == temp //&&
                  //!action.dominates(action.target, false)
                ) {
                  if (!action.target.isEvil()) {
                    this.achievement.SavedCount++;
                  }
                  break;
                }
              }
              */
            },
          });

          this.game.queueAction(action);
        }
      },
      aboutToFinish: function () {
        if (this.SavedCount >= 2) {
          this.player.EarnedAchievements.push("Mafia37");
        }
      },
    };
  }
};

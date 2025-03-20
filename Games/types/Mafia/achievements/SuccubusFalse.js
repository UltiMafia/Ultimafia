const Achievements = require("../Achievements");
const Action = require("../Action");
const {
  PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
} = require("../const/Priority");

module.exports = class SuccubusFalse extends Achievements {
  constructor(name, player) {
    super(name, player);
  this.FalseInfo = 0;
    this.listeners = {
      state: function (stateInfo) {
        if (stateInfo.name.match(/Day/)) {
          this.DeliriousPlayer = null;
          return;
        }
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        if (this.player.role.name == "Succubus") {
          var action = new Action({
            actor: null,
            target: this.player,
            game: this.player.game,
            priority: PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT + 1,
            labels: ["hidden", "absolute"],
            achievement: this,
            run: function () {
              for (let action of this.game.actions[0]) {
                if (
                  action.hasLabels(["block", "delirium"]) &&
                  action.actor == this.target &&
                  action.dominates(action.target, false)
                ) {
                  if (
                    this.game.getRoleAlignment(action.target.role.name) ==
                    "Village"
                  ) {
                    this.achievement.DeliriousPlayer = action.target;
                  }
                  break;
                }
              }
            },
          });

          this.game.queueAction(action);
        }
      },
      Information: function (info) {
        if (this.DeliriousPlayer == null || this.player.role.name != "Succubus") {
          return;
        }
        if (
          info.creator &&
          info.creator == this.DeliriousPlayer
        ) {
          if (info.isFalse()) {
            this.FalseInfo += 1;
          }
        }
      },
      aboutToFinish: function () {
        if (this.FalseInfo >= 3) {
          this.player.EarnedAchievements.push("Mafia30");
        }
      },
    };
  }
};

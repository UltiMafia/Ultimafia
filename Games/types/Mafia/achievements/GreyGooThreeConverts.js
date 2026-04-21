const Achievements = require("../Achievements");
const Action = require("../Action");
const { PRIORITY_CONVERT_DEFAULT } = require("../const/Priority");

module.exports = class GreyGooThreeConverts extends Achievements {
  constructor(name, player) {
    super(name, player);
    this.ConvertCount = 0;
    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        if (this.player.role.name != "Grey Goo") {
          return;
        }
        var action = new Action({
          actor: null,
          target: this.player,
          game: this.player.game,
          priority: PRIORITY_CONVERT_DEFAULT + 10,
          labels: ["hidden", "absolute"],
          achievement: this,
          run: function () {
            for (let action of this.game.actions[0]) {
              if (
                action.hasLabels(["convert", "seppuku"]) &&
                action.actor == this.target &&
                action.dominates(action.target, false)
              ) {
                this.achievement.ConvertCount++;
                break;
              }
            }
          },
        });

        this.game.queueAction(action);
      },
      aboutToFinish: function () {
        if (this.ConvertCount >= 3) {
          this.player.EarnedAchievements.push("Mafia71");
        }
      },
    };
  }
};

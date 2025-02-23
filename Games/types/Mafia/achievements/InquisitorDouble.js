const Achievements = require("../Achievements");
const Action = require("../Action");
const { PRIORITY_KILL_DEFAULT } = require("../const/Priority");

module.exports = class InquisitorDouble extends Achievements {
  constructor(name, player) {
    super(name, player);
    this.ConvertCount = 0;
    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        if (this.player.role.name == "Inquisitor" && this.ConvertCount < 2) {
          var action = new Action({
            actor: null,
            target: this.player,
            game: this.player.game,
            priority: PRIORITY_KILL_DEFAULT + 2,
            labels: ["hidden", "absolute"],
            achievement: this,
            run: function () {
              for (let action of this.game.actions[0]) {
                if (
                  action.hasLabels(["kill"]) &&
                  action.actor == this.target &&
                  action.target.alive
                ) {
                  if (action.target.role.name == "Cultist") {
                    this.achievement.ConvertCount++;
                  }
                  break;
                }
              }
            },
          });

          this.game.queueAction(action);
        }
      },
      aboutToFinish: function () {
        if (this.ConvertCount >= 2) {
          this.player.EarnedAchievements.push("Mafia15");
        }
      },
    };
  }
};

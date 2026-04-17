const Achievements = require("../Achievements");
const Action = require("../Action");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../const/Priority");

module.exports = class CthulhuThreeInsane extends Achievements {
  constructor(name, player) {
    super(name, player);
    this.InsanePlayers = [];
    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        if (this.player.role.name != "Cthulhu") {
          return;
        }
        var action = new Action({
          actor: null,
          target: this.player,
          game: this.player.game,
          priority: PRIORITY_EFFECT_GIVER_DEFAULT + 1,
          labels: ["hidden", "absolute"],
          achievement: this,
          run: function () {
            for (let action of this.game.actions[0]) {
              if (
                action.hasLabels(["giveEffect", "insanity"]) &&
                action.actor == this.target
              ) {
                const visitors = action.getVisitors
                  ? action.getVisitors()
                  : [];
                for (let v of visitors) {
                  if (!this.achievement.InsanePlayers.includes(v)) {
                    this.achievement.InsanePlayers.push(v);
                  }
                }
                break;
              }
            }
          },
        });

        this.game.queueAction(action);
      },
      aboutToFinish: function () {
        if (this.InsanePlayers.length >= 3) {
          this.player.EarnedAchievements.push("Mafia69");
        }
      },
    };
  }
};

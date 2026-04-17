const Achievements = require("../Achievements");
const Action = require("../Action");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../const/Priority");

module.exports = class AlienThreeProbes extends Achievements {
  constructor(name, player) {
    super(name, player);
    this.ProbedPlayers = [];
    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        if (this.player.role.name != "Alien") {
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
                action.hasLabels(["effect", "probe"]) &&
                action.actor == this.target &&
                action.dominates(action.target, false)
              ) {
                if (
                  action.target &&
                  action.target.role &&
                  !this.achievement.ProbedPlayers.includes(action.target)
                ) {
                  this.achievement.ProbedPlayers.push(action.target);
                }
                break;
              }
            }
          },
        });

        this.game.queueAction(action);
      },
      aboutToFinish: function () {
        if (this.ProbedPlayers.length >= 3) {
          this.player.EarnedAchievements.push("Mafia67");
        }
      },
    };
  }
};

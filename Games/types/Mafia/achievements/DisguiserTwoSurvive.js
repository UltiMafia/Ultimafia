const Achievements = require("../Achievements");
const Action = require("../Action");
const { PRIORITY_IDENTITY_STEALER } = require("../const/Priority");

module.exports = class DisguiserTwoSurvive extends Achievements {
  constructor(name, player) {
    super(name, player);
    this.DisguiseCount = 0;
    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        if (this.player.role.name != "Disguiser") {
          return;
        }
        var action = new Action({
          actor: null,
          target: this.player,
          game: this.player.game,
          priority: PRIORITY_IDENTITY_STEALER + 1,
          labels: ["hidden", "absolute"],
          achievement: this,
          run: function () {
            let stealingYes = false;
            for (let action of this.game.actions[0]) {
              if (
                action.hasLabel("stealIdentity") &&
                action.actor == this.target &&
                action.target == "Yes"
              ) {
                stealingYes = true;
                break;
              }
            }
            if (!stealingYes) {
              return;
            }
            for (let action of this.game.actions[0]) {
              if (
                action.hasLabels(["kill", "mafia"]) &&
                action.dominates(action.target, false) &&
                action.target &&
                action.target.alive
              ) {
                this.achievement.DisguiseCount++;
                break;
              }
            }
          },
        });

        this.game.queueAction(action);
      },
      aboutToFinish: function () {
        if (this.DisguiseCount >= 2 && this.player.alive) {
          this.player.EarnedAchievements.push("Mafia55");
        }
      },
    };
  }
};

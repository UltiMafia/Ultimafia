const Achievements = require("../Achievements");
const Action = require("../Action");
const { PRIORITY_OVERTHROW_VOTE } = require("../const/Priority");

module.exports = class GovernatorFlip extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Dusk/)) {
          return;
        }
        if (this.player.role.name != "Governor") {
          return;
        }
        if (this.AchievedFlip) {
          return;
        }
        var action = new Action({
          actor: null,
          target: this.player,
          game: this.player.game,
          priority: PRIORITY_OVERTHROW_VOTE + 1,
          labels: ["hidden", "absolute"],
          achievement: this,
          run: function () {
            let preventedBadLynch = false;
            for (let action of this.game.actions[0]) {
              if (
                action.hasLabel("condemn") &&
                !action.hasLabel("overthrow") &&
                action.target &&
                action.target.role &&
                !action.target.isEvil(true)
              ) {
                preventedBadLynch = true;
                break;
              }
            }
            if (!preventedBadLynch) {
              return;
            }
            for (let action of this.game.actions[0]) {
              if (
                action.hasLabel("overthrow") &&
                action.actor == this.target &&
                action.target &&
                action.target.role &&
                action.target.isEvil(true) &&
                action.dominates(action.target, false)
              ) {
                this.achievement.AchievedFlip = true;
                break;
              }
            }
          },
        });

        this.game.queueAction(action);
      },
      aboutToFinish: function () {
        if (this.AchievedFlip == true) {
          this.player.EarnedAchievements.push("Mafia54");
        }
      },
    };
  }
};

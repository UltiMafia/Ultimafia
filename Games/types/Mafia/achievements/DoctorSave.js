const Achievements = require("../Achievements");
const Action = require("../Action");
const { PRIORITY_KILL_DEFAULT } = require("../const/Priority");

module.exports = class DoctorSave extends Achievements {
  constructor(name, player) {
    super(name, player);
    this.ConvertCount = 0;
    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        if (this.player.role.name == "Doctor" && this.Saved != true) {
          var action = new Action({
            actor: null,
            target: this.player,
            game: this.player.game,
            priority: PRIORITY_KILL_DEFAULT + 2,
            labels: ["hidden", "absolute"],
            achievement: this,
            run: function () {
              let temp;
              for (let action of this.game.actions[0]) {
                if (
                  action.hasLabels(["save"]) &&
                  action.actor == this.target &&
                  action.target.alive
                ) {
                  if (!action.target.isEvil(true)) {
                    temp = action.target;
                  }
                  break;
                }
              }
              if (temp == null) {
                return;
              }
              for (let action of this.game.actions[0]) {
                if (
                  action.hasLabels(["kill"]) &&
                  action.target == temp &&
                  temp.alive
                ) {
                  if (!action.target.isEvil(true)) {
                    this.achievement.Saved = true;
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
        if (this.Saved == true) {
          this.player.EarnedAchievements.push("Mafia22");
        }
      },
    };
  }
};

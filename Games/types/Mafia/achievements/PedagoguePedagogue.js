const Achievements = require("../Achievements");
const Action = require("../Action");
const { PRIORITY_CONVERT_DEFAULT } = require("../const/Priority");

module.exports = class PedagoguePedagogue extends Achievements {
  constructor(name, player) {
    super(name, player);
    this.ConvertHappened = false;
    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        if (
          this.player.role.name == "Pedagogue" &&
          this.ConvertHappened != true
        ) {
          var action = new Action({
            actor: null,
            target: this.player,
            game: this.player.game,
            priority: PRIORITY_CONVERT_DEFAULT - 2,
            labels: ["hidden", "absolute"],
            achievement: this,
            run: function () {
              let check1 = false;
              let check2 = false;
              for (let action of this.game.actions[0]) {
                if (
                  action.hasLabels(["convert"]) &&
                  action.actor == this.target
                ) {
                  if (action.target.role.name == "Pedagogue") {
                    check1 = true;
                  }
                }
                if (
                  action.hasLabels(["convert"]) &&
                  action.target == this.target
                ) {
                  if (action.actor.role.name == "Pedagogue") {
                    check2 = true;
                  }
                  break;
                }
              }
              if (check1 && check2) {
                this.achievement.ConvertHappened = true;
              }
            },
          });

          this.game.queueAction(action);
        }
      },
      aboutToFinish: function () {
        if (this.ConvertHappened == true) {
          this.player.EarnedAchievements.push("Mafia35");
        }
      },
    };
  }
};

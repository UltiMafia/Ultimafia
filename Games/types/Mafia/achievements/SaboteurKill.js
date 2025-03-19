const Achievements = require("../Achievements");
const Action = require("../Action");
const { PRIORITY_KILL_DEFAULT } = require("../const/Priority");

module.exports = class SaboteurKill extends Achievements {
  constructor(name, player) {
    super(name, player);
    this.GunnedPlayers = [];
    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        if (this.player.role.name == "Saboteur" && this.KilledEvil != true) {
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
                  action.hasLabels(["sabotage"]) &&
                  action.actor == this.target &&
                   action.target.hasItem("Gun")
                ) {
                  this.achievement.GunnedPlayers.push(action.target);
                  break;
                }
              }
            },
          });

          this.game.queueAction(action);
        }
      },
      death: function (player, killer, deathType) {
        if (this.GunnedPlayers.includes(killer) && deathType == "gun") {
          if (killer == player) {
            this.KilledPlayer = true;
          }
        }
      },
      aboutToFinish: function () {
        if (this.KilledPlayer == true) {
          this.player.EarnedAchievements.push("Mafia26");
        }
      },
    };
  }
};

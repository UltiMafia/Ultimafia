const Achievements = require("../Achievements");
const Action = require("../Action");
const { PRIORITY_CONVERT_DEFAULT } = require("../const/Priority");

module.exports = class LobotomistAllVPR extends Achievements {
  constructor(name, player) {
    super(name, player);
    this.ConvertedPlayers = new Set();
    this.InitialVPRs = null;
    this.listeners = {
      start: function () {
        this.InitialVPRs = new Set();
        for (let p of this.game.players) {
          if (
            this.game.getRoleAlignment(p.role.name) == "Village" &&
            p.role.name != "Villager"
          ) {
            this.InitialVPRs.add(p);
          }
        }
      },
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        if (this.player.role.name != "Lobotomist") {
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
                action.hasLabels(["convert"]) &&
                action.actor == this.target &&
                action.dominates(action.target, false)
              ) {
                if (this.achievement.InitialVPRs.has(action.target)) {
                  this.achievement.ConvertedPlayers.add(action.target);
                }
                break;
              }
            }
          },
        });

        this.game.queueAction(action);
      },
      aboutToFinish: function () {
        if (!this.InitialVPRs || this.InitialVPRs.size == 0) {
          return;
        }
        if (this.ConvertedPlayers.size >= this.InitialVPRs.size) {
          this.player.EarnedAchievements.push("Mafia52");
        }
      },
    };
  }
};

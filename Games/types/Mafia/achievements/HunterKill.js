const Achievements = require("../Achievements");
const Action = require("../Action");
const { PRIORITY_KILL_DEFAULT } = require("../const/Priority");

module.exports = class HunterKill extends Achievements {
  constructor(name, player) {
    super(name, player);
    this.KillCount = 0;
    this.listeners = {
      death: function (player, killer, deathType) {
        if (
          killer == this.player &&
          deathType == "condemnRevenge" &&
          this.player.role.name == "Hunter" &&
          this.game.alivePlayers().length <= 2
        )
          if (player.isEvil(true)) {
            this.Kill = true;
          }
      },
      aboutToFinish: function () {
        if (this.Kill == true) {
          this.player.EarnedAchievements.push("Mafia40");
        }
      },
    };
  }
};

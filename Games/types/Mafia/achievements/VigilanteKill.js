const Achievements = require("../Achievements");
const Action = require("../Action");
const { PRIORITY_KILL_DEFAULT } = require("../const/Priority");

module.exports = class VigilanteKill extends Achievements {
  constructor(name, player) {
    super(name, player);
    this.KillCount = 0;
    this.listeners = {
      death: function (player, killer, deathType) {
        if (
          killer == this.player &&
          deathType == "basic" &&
          this.player.role.name == "Vigilante"
        )
          if (player.isEvil(true)) {
            this.KillCount++;
          }
      },
      aboutToFinish: function () {
        if (this.KillCount >= 2) {
          this.player.EarnedAchievements.push("Mafia23");
        }
      },
    };
  }
};

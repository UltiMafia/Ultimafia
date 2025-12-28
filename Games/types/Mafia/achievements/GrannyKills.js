const Achievements = require("../Achievements");
const Action = require("../Action");
const { PRIORITY_KILL_DEFAULT } = require("../const/Priority");

module.exports = class GrannyKills extends Achievements {
  constructor(name, player) {
    super(name, player);
    this.KillCount = 0;
    this.listeners = {
      death: function (player, killer, deathType) {
        if (
          killer == this.player &&
          deathType == "basic" &&
          this.player.role.name == "Granny"
        )
          if (player.isEvil(true)) {
            this.KillCount++;
          }
      },
      afterActions: function () {
        if (this.KillCount <= 1) {
          this.KillCount = 0;
        }
      },
      aboutToFinish: function () {
        if (this.KillCount >= 2) {
          this.player.EarnedAchievements.push("Mafia38");
        }
      },
    };
  }
};

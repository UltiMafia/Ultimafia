const Achievements = require("../Achievements");

module.exports = class VampireTwoKills extends Achievements {
  constructor(name, player) {
    super(name, player);
    this.KillCount = 0;
    this.listeners = {
      death: function (player, killer, deathType) {
        if (this.player.role.name != "Vampire") {
          return;
        }
        if (killer != this.player) {
          return;
        }
        if (deathType != "basic") {
          return;
        }
        this.KillCount++;
      },
      aboutToFinish: function () {
        if (this.KillCount >= 2) {
          this.player.EarnedAchievements.push("Mafia61");
        }
      },
    };
  }
};

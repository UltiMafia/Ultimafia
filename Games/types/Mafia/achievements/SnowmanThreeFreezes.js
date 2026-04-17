const Achievements = require("../Achievements");

module.exports = class SnowmanThreeFreezes extends Achievements {
  constructor(name, player) {
    super(name, player);
    this.SnowballKills = 0;
    this.listeners = {
      death: function (player, killer, deathType) {
        if (this.player.role.name != "Snowman") {
          return;
        }
        if (deathType != "snowball") {
          return;
        }
        this.SnowballKills++;
      },
      aboutToFinish: function () {
        if (this.SnowballKills >= 3) {
          this.player.EarnedAchievements.push("Mafia75");
        }
      },
    };
  }
};

const Achievements = require("../Achievements");

module.exports = class HeartbreakerCondemnedLove extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (this.player.role.name != "Heartbreaker") {
          return;
        }
        if (deathType != "condemn") {
          return;
        }
        if (player != this.player.role.loves) {
          return;
        }
        if (this.game.getRoleAlignment(player.role.name) != "Village") {
          return;
        }
        this.CondemnedLove = true;
      },
      aboutToFinish: function () {
        if (this.CondemnedLove == true) {
          this.player.EarnedAchievements.push("Mafia53");
        }
      },
    };
  }
};

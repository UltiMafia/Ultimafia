const Achievements = require("../Achievements");

module.exports = class SerialKillerSoleSurvivor extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      aboutToFinish: function () {
        if (this.player.role.name != "Serial Killer") {
          return;
        }
        if (!this.player.alive) {
          return;
        }
        if (this.game.alivePlayers().length != 1) {
          return;
        }
        this.player.EarnedAchievements.push("Mafia63");
      },
    };
  }
};

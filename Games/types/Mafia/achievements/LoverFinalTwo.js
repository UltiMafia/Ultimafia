const Achievements = require("../Achievements");

module.exports = class LoverFinalTwo extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      aboutToFinish: function () {
        if (this.player.role.name != "Lover") {
          return;
        }
        if (!this.player.alive) {
          return;
        }
        if (this.game.alivePlayers().length != 2) {
          return;
        }
        this.player.EarnedAchievements.push("Mafia46");
      },
    };
  }
};

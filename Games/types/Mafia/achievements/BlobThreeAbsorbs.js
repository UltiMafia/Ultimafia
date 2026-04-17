const Achievements = require("../Achievements");

module.exports = class BlobThreeAbsorbs extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      aboutToFinish: function () {
        if (this.player.role.name != "Blob") {
          return;
        }
        if (!this.player.role.BlobKills || this.player.role.BlobKills < 3) {
          return;
        }
        this.player.EarnedAchievements.push("Mafia70");
      },
    };
  }
};

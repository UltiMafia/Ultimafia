const Achievements = require("../Achievements");

module.exports = class OracleRevealEvil extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      Information: function (info) {
        if (this.player.role.name != "Oracle") {
          return;
        }
        if (!info.creator || info.creator != this.player) {
          return;
        }
        if (info.name != "Reveal Info") {
          return;
        }
        if (this.player.alive) {
          return;
        }
        if (info.target && info.target.isEvil(true)) {
          this.RevealedEvil = true;
        }
      },
      aboutToFinish: function () {
        if (this.RevealedEvil == true) {
          this.player.EarnedAchievements.push("Mafia49");
        }
      },
    };
  }
};

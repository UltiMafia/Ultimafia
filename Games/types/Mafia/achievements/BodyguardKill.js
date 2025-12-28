const Achievements = require("../Achievements");

module.exports = class BodyguardKill extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (
          killer == this.player &&
          deathType == "basic" &&
          this.player.role.name == "Bodyguard"
        )
          if (player.isEvil(true)) {
            this.KilledEvil = true;
          }
      },
      aboutToFinish: function () {
        if (this.KilledEvil == true) {
          this.player.EarnedAchievements.push("Mafia21");
        }
      },
    };
  }
};

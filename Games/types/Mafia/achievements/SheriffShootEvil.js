const Achievements = require("../Achievements");

module.exports = class SheriffShootEvil extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (
          killer == this.player &&
          deathType == "gun" &&
          this.player.role.name == "Sheriff"
        )
          if (player.isEvil(true)) {
            this.ShotEvil = true;
          }
      },
      aboutToFinish: function () {
        if (this.ShotEvil == true) {
          this.player.EarnedAchievements.push("Mafia9");
        }
      },
    };
  }
};

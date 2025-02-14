const Achievements = require("../Achievements");

module.exports = class SheriffShootEvil extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (killer == this.player && deathType == "gun")
          if (player.isEvil()) {
            this.ShotEvil = true;
          }
      },
      aboutToFinish: function () {
        if (this.player.role.name != "Sheriff") {
          return;
        }
        if (this.ShotEvil == true) {
          this.player.EarnedAchievements.push("Mafia9");
        }
      },
    };
  }
};

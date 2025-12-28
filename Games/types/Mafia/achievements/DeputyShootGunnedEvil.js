const Achievements = require("../Achievements");

module.exports = class DeputyShootGunnedEvil extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (
          killer == this.player &&
          deathType == "gun" &&
          this.player.role.name == "Deputy"
        )
          if (
            player.isEvil(true) &&
            (player.hasItem("Gun") || player.hasItem("Rifle"))
          ) {
            this.ShotGunnedEvil = true;
          }
      },
      aboutToFinish: function () {
        if (this.ShotGunnedEvil == true) {
          this.player.EarnedAchievements.push("Mafia11");
        }
      },
    };
  }
};

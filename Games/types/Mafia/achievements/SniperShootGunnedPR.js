const Achievements = require("../Achievements");

module.exports = class SniperShootGunnedPR extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (
          killer == this.player &&
          deathType == "gun" &&
          this.player.role.name == "Sniper"
        )
          if (
            !player.isEvil(true) &&
            player.role.name != "Villager" &&
            (player.hasItem("Gun") || player.hasItem("Rifle"))
          ) {
            this.ShotGunnedPR = true;
          }
      },
      aboutToFinish: function () {
        if (this.ShotGunnedPR == true) {
          this.player.EarnedAchievements.push("Mafia25");
        }
      },
    };
  }
};

const Achievements = require("../Achievements");

module.exports = class ArsonistIgniteDayOne extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (this.player.role.name != "Arsonist") {
          return;
        }
        if (killer != this.player) {
          return;
        }
        if (deathType != "burn") {
          return;
        }
        if (this.game.getStateInfo().dayCount != 1) {
          return;
        }
        if (
          this.game.getRoleAlignment(player.role.name) == "Village" &&
          player.role.name != "Villager"
        ) {
          this.IgnitedPR = true;
        }
      },
      aboutToFinish: function () {
        if (this.IgnitedPR == true) {
          this.player.EarnedAchievements.push("Mafia47");
        }
      },
    };
  }
};

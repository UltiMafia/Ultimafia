const Achievements = require("../Achievements");

module.exports = class UndertakerCleanPR extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      Information: function (info) {
        if (
          info.creator &&
          info.creator == this.player &&
          this.player.role.name == "Undertaker"
        ) {
          if (
            info.isTrue() &&
            info.name == "Role Info" &&
            info.investType == "condemn" &&
            this.game.getRoleAlignment(info.target.role.name) == "Village" &&
            info.target.role.name != "Villager"
          ) {
            this.GoodClean = true;
          }
        }
      },
      aboutToFinish: function () {
        if (this.GoodClean == true) {
          this.player.EarnedAchievements.push("Mafia39");
        }
      },
    };
  }
};

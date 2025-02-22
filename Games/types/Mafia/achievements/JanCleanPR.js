const Achievements = require("../Achievements");

module.exports = class JanCleanPR extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      Information: function (info) {
        if (
          info.creator &&
          info.creator == this.player &&
          this.player.role.name == "Janitor"
        ) {
          if (
            info.isTrue() &&
            info.name == "Role Info" &&
            info.investType == "death" &&
            this.game.getRoleAlignment(info.target.role.name) == "Village" &&
            info.target.role.name != "Villager"
          ) {
            this.GoodClean = true;
          }
        }
      },
      aboutToFinish: function () {
        if (this.GoodClean == true) {
          this.player.EarnedAchievements.push("Mafia14");
        }
      },
    };
  }
};

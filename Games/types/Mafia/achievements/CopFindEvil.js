const Achievements = require("../Achievements");

module.exports = class CopFindEvil extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      Information: function (info) {
        if (
          info.creator &&
          info.creator == this.player &&
          this.player.role.name == "Cop"
        ) {
          if (
            info.isTrue() &&
            info.name == "Binary Alignment Info" &&
            info.mainInfo == "Guilty"
          ) {
            this.GoodCheck = true;
          }
        }
      },
      aboutToFinish: function () {
        if (this.GoodCheck == true) {
          this.player.EarnedAchievements.push("Mafia12");
        }
      },
    };
  }
};

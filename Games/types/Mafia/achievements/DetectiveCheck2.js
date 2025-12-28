const Achievements = require("../Achievements");

module.exports = class DetectiveCheck2 extends Achievements {
  constructor(name, player) {
    super(name, player);
    this.GoodChecks = 0;
    this.hasChecked = [];
    this.listeners = {
      Information: function (info) {
        if (
          info.creator &&
          info.creator == this.player &&
          this.player.role.name == "Detective"
        ) {
          if (
            info.isTrue() &&
            info.name == "Role Info" &&
            info.target.isEvil(true) == true &&
            !this.hasChecked.includes(info.target)
          ) {
            this.GoodChecks++;
            this.hasChecked.push(info.target);
          }
        }
      },
      aboutToFinish: function () {
        if (
          this.GoodChecks >= 2 &&
          this.player.alive &&
          this.player.role.name == "Detective"
        ) {
          this.player.EarnedAchievements.push("Mafia20");
        }
      },
    };
  }
};

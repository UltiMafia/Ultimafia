const Achievements = require("../Achievements");

module.exports = class TrackerCheck extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      Information: function (info) {
        if (
          info.creator &&
          info.creator == this.player &&
          this.player.role.name == "Tracker"
        ) {
          if (
            info.isTrue() &&
            info.name == "Tracker Info" &&
            info.mainInfo.includes(this.player)
          ) {
            this.GoodCheck = true;
          }
        }
      },
      aboutToFinish: function () {
        if (this.GoodCheck == true) {
          this.player.EarnedAchievements.push("Mafia32");
        }
      },
    };
  }
};

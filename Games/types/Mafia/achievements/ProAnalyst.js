const Achievements = require("../Achievements");

module.exports = class ProAnalyst extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      Information: function (info) {
        if (info.creator && info.creator == this.player) {
          if (
            info.isTrue() &&
            info.name == "Guess Role Info" &&
            info.mainInfo == 5
          ) {
            this.GoodGuess = true;
          }
        }
      },
      aboutToFinish: function () {
        if (this.player.role.name != "Analyst") {
          return;
        }
        if (this.GoodGuess == true) {
          this.player.EarnedAchievements.push("Mafia10");
        }
      },
    };
  }
};

const Achievements = require("../Achievements");

module.exports = class ProAnalyst extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      Information: function (info) {
        if (
          info.creator &&
          info.creator == this.player &&
          this.player.role.name == "Analyst"
        ) {
          if (
            info.isTrue() &&
            info.name == "Guess Role Info" &&
            info.mainInfo == 5
          ) {
            let temp = [];
            for (let player of info.target) {
              if (temp.includes(player)) {
                return;
              }
              temp.push(player);
            }
            this.GoodGuess = true;
          }
        }
      },
      aboutToFinish: function () {
        if (this.GoodGuess == true) {
          this.player.EarnedAchievements.push("Mafia10");
        }
      },
    };
  }
};

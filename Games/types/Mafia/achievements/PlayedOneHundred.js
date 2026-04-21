const Achievements = require("../Achievements");

module.exports = class PlayedOneHundred extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      aboutToFinish: function () {
        const played = (this.player.user.gamesPlayed || 0) + 1;
        if (played < 100) {
          return;
        }
        this.player.EarnedAchievements.push("Mafia82");
      },
    };
  }
};

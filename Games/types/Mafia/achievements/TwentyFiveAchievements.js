const Achievements = require("../Achievements");

module.exports = class TwentyFiveAchievements extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      aboutToFinish: function () {
        const earned = new Set([
          ...(this.player.user.achievements || []),
          ...(this.player.EarnedAchievements || []),
        ]);
        earned.delete("Mafia83");
        if (earned.size < 25) {
          return;
        }
        this.player.EarnedAchievements.push("Mafia83");
      },
    };
  }
};

const Achievements = require("../Achievements");

module.exports = class ReaperWinByChoice extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      aboutToFinish: function () {
        if (this.player.role.name != "Reaper") {
          return;
        }
        if (!this.player.role.ReaperWin) {
          return;
        }
        if (
          Object.values(this.game.winners.groups)
            .flat()
            .find((p) => p === this.player)
        ) {
          this.player.EarnedAchievements.push("Mafia64");
        }
      },
    };
  }
};

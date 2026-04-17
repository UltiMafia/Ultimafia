const Achievements = require("../Achievements");

module.exports = class MagusWinDayOne extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      aboutToFinish: function () {
        if (this.player.role.name != "Magus") {
          return;
        }
        if (!this.game.MagusGameDeclared) {
          return;
        }
        if (this.game.getStateInfo().dayCount > 1) {
          return;
        }
        if (
          Object.values(this.game.winners.groups)
            .flat()
            .find((p) => p === this.player)
        ) {
          this.player.EarnedAchievements.push("Mafia45");
        }
      },
    };
  }
};

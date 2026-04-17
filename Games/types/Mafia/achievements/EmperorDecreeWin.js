const Achievements = require("../Achievements");

module.exports = class EmperorDecreeWin extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      aboutToFinish: function () {
        if (this.player.role.name != "Emperor") {
          return;
        }
        if (!this.player.role.predictedCorrect || this.player.role.predictedCorrect < 2) {
          return;
        }
        if (!this.player.alive) {
          return;
        }
        if (
          Object.values(this.game.winners.groups)
            .flat()
            .find((p) => p === this.player)
        ) {
          this.player.EarnedAchievements.push("Mafia72");
        }
      },
    };
  }
};

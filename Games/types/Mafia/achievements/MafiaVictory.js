const Achievements = require("../Achievements");

module.exports = class MafiaVictory extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      aboutToFinish: function () {
        if (this.player.role.alignment != "Mafia") {
          return;
        }
        if (
          Object.values(this.game.winners.groups)
            .flat()
            .find((p) => p === this.player)
        ) {
          this.player.EarnedAchievements.push("Mafia2");
        }
      },
    };
  }
};

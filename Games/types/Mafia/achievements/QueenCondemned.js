const Achievements = require("../Achievements");

module.exports = class QueenCondemned extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (deathType == "condemn" && player.role.name == "Queen") {
          this.QueenCondemned = true;
        }
      },
      aboutToFinish: function () {
        if (!this.QueenCondemned) {
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
          this.player.EarnedAchievements.push("Mafia42");
        }
      },
    };
  }
};

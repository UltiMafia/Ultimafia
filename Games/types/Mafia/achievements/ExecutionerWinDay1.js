const Achievements = require("../Achievements");

module.exports = class ExecutionerWinDayOne extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (
          player === this.player.role.target &&
          deathType === "condemn" &&
          this.player.alive &&
          this.game.getStateInfo().dayCount == 1
        ) {
          this.ExeWinDayOne = true;
        }
      },
      aboutToFinish: function () {
        if (this.player.role.name != "Executioner") {
          return;
        }
        if (
          Object.values(this.game.winners.groups)
            .flat()
            .find((p) => p === this.player) &&
          this.ExeWinDayOne == true
        ) {
          this.player.EarnedAchievements.push("Mafia17");
        }
      },
    };
  }
};

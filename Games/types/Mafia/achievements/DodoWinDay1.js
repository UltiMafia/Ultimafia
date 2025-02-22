const Achievements = require("../Achievements");

module.exports = class DodoWinDay1 extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (
          player == this.player &&
          deathType == "gun" &&
          this.game.getStateInfo().dayCount == 1
        )
          this.DodoWinDayOne = true;
      },
      aboutToFinish: function () {
        if (this.player.role.name != "Dodo") {
          return;
        }
        if (
          Object.values(this.game.winners.groups)
            .flat()
            .find((p) => p === this.player) &&
          this.DodoWinDayOne == true
        ) {
          this.player.EarnedAchievements.push("Mafia18");
        }
      },
    };
  }
};

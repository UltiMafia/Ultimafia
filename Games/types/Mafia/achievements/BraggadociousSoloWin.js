const Achievements = require("../Achievements");

module.exports = class BraggadociousSoloWin extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      aboutToFinish: function () {
        if (
          !this.player.role.modifier ||
          !this.player.role.modifier.split("/").includes("Braggadocious")
        ) {
          return;
        }
        if (this.game.getRoleAlignment(this.player.role.name) != "Independent") {
          return;
        }
        if (
          !Object.values(this.game.winners.groups)
            .flat()
            .find((p) => p === this.player)
        ) {
          return;
        }
        this.player.EarnedAchievements.push("Mafia79");
      },
    };
  }
};

const Achievements = require("../Achievements");

module.exports = class MachoDieAndWin extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      aboutToFinish: function () {
        if (
          !this.player.role.modifier ||
          !this.player.role.modifier.split("/").includes("Macho")
        ) {
          return;
        }
        if (this.player.alive) {
          return;
        }
        if (
          Object.values(this.game.winners.groups)
            .flat()
            .find((p) => p === this.player)
        ) {
          this.player.EarnedAchievements.push("Mafia76");
        }
      },
    };
  }
};

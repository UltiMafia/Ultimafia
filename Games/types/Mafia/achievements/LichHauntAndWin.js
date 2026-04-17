const Achievements = require("../Achievements");

module.exports = class LichHauntAndWin extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      aboutToFinish: function () {
        if (this.player.role.name != "Lich") {
          return;
        }
        if (!this.player.role.data.DreamHost) {
          return;
        }
        if (
          Object.values(this.game.winners.groups)
            .flat()
            .find((p) => p === this.player)
        ) {
          this.player.EarnedAchievements.push("Mafia68");
        }
      },
    };
  }
};

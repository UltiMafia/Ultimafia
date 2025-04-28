const Achievements = require("../Achievements");

module.exports = class DeclareMagusAsEvil extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      aboutToFinish: function () {
        if (this.game.getRoleAlignment(this.player.role.name) != "Mafia" && this.game.getRoleAlignment(this.player.role.name) != "Cult") {
          return;
        }
        if (
          Object.values(this.game.winners.groups)
            .flat()
            .find((p) => p === this.player) && this.game.MagusGameDeclared == true
        ) {
          this.player.EarnedAchievements.push("Mafia34");
        }
      },
    };
  }
};

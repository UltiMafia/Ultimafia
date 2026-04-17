const Achievements = require("../Achievements");

module.exports = class ChaoticRerollWin extends Achievements {
  constructor(name, player) {
    super(name, player);
    if (
      player.role.modifier &&
      player.role.modifier.split("/").includes("Chaotic")
    ) {
      this.OriginalRole = player.role.name;
      this.HadChaotic = true;
    }
    this.listeners = {
      aboutToFinish: function () {
        if (!this.HadChaotic) {
          return;
        }
        if (this.player.role.name == this.OriginalRole) {
          return;
        }
        if (
          Object.values(this.game.winners.groups)
            .flat()
            .find((p) => p === this.player)
        ) {
          this.player.EarnedAchievements.push("Mafia78");
        }
      },
    };
  }
};

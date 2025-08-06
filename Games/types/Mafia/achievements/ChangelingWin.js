const Achievements = require("../Achievements");

module.exports = class ChangelingWin extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      aboutToFinish: function () {
        if (this.player.role.name != "Changeling") {
          return;
        }
        if (
          Object.values(this.game.winners.groups)
            .flat()
            .find((p) => p === this.player) &&
          this.player.role.data.twincondemned &&
          this.player.role.hasAbility(["Win-Con"])
        ) {
          this.player.EarnedAchievements.push("Mafia16");
        }
      },
    };
  }
};

const Achievements = require("../Achievements");

module.exports = class AllAlignmentWins extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      aboutToFinish: function () {
        if (
          !Object.values(this.game.winners.groups)
            .flat()
            .find((p) => p === this.player)
        ) {
          return;
        }
        const stats = this.player.user?.stats?.Mafia?.all?.byAlignment;
        if (!stats) {
          return;
        }
        const currentAlignment = this.game.getRoleAlignment(this.player.role.name);
        const alignmentsNeeded = ["Village", "Mafia", "Cult", "Independent"];
        for (let alignment of alignmentsNeeded) {
          if (alignment == currentAlignment) {
            continue;
          }
          const entry = stats[alignment];
          if (!entry || !entry.wins || !entry.wins.count) {
            return;
          }
        }
        this.player.EarnedAchievements.push("Mafia80");
      },
    };
  }
};

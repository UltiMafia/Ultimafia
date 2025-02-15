const Achievements = require("../Achievements");
const {
  EVIL_FACTIONS,
  NOT_EVIL_FACTIONS,
  CULT_FACTIONS,
  MAFIA_FACTIONS,
  FACTION_LEARN_TEAM,
  FACTION_WIN_WITH_MAJORITY,
  FACTION_WITH_MEETING,
  FACTION_KILL,
} = require("../const/FactionList");

module.exports = class AllDeadAreCult extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      aboutToFinish: function () {
        if (this.player.role.name != "Cult Leader") {
          return;
        }
        if (this.game.deadPlayers().length <= 0) {
          return;
        }
        for (let player of this.game.deadPlayers()) {
          if (!CULT_FACTIONS.includes(player.faction)) {
            return;
          }
        }
        if (
          Object.values(this.game.winners.groups)
            .flat()
            .find((p) => p === this.player)
        ) {
          this.player.EarnedAchievements.push("Mafia7");
        }
      },
    };
  }
};

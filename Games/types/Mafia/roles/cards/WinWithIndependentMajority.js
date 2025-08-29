const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");
const {
  EVIL_FACTIONS,
  NOT_EVIL_FACTIONS,
  CULT_FACTIONS,
  MAFIA_FACTIONS,
  FACTION_LEARN_TEAM,
  FACTION_WIN_WITH_MAJORITY,
  FACTION_WITH_MEETING,
  FACTION_KILL,
} = require("../../const/FactionList");

module.exports = class WinWithIndependentMajority extends Card {
  constructor(role) {
    super(role);

    role.polarisedKills = 0;
    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        if (!this.player.alive) {
          return;
        }

        const ONE_NIGHT = this.game.IsBloodMoon;

        if (this.game.hasBeenDay == true) {
          if (ONE_NIGHT && this.canDoSpecialInteractions()) {
            var deadTeam = this.game.deadPlayers();
            filter(
              (p) =>
                this.game.getRoleAlignment(
                  p.getRoleAppearance().split(" (")[0]
                ) == "Independent" &&
                !this.game
                  .getRoleTags(p.getRoleAppearance().split(" (")[0])
                  .includes("Lone")
            );
            if (deadTeam.length <= 0 || this.game.deadPlayers().length <= 0) {
              winners.addPlayer(this.player, this.name);
              return;
            }
          }
        }
        // win with majority
        const numIndependentAlive = this.game.players.filter(
          (p) =>
            this.game.getRoleAlignment(p.role.name) == "Independent" &&
            !this.game
              .getRoleTags(
                this.game.formatRoleInternal(p.role.name, p.role.modifier)
              )
              .includes("Lone") &&
            p.alive
        ).length;
        if (
          aliveCount > 0 &&
          numIndependentAlive >= aliveCount / 2 &&
          !ONE_NIGHT
        ) {
          winners.addPlayer(this.player, this.name);
          return;
        }
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
      },
    };
  }
};

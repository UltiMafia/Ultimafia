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
        const CULT_IN_GAME =
          this.game.players.filter((p) => CULT_FACTIONS.includes(p.faction))
            .length > 0;
        const MAFIA_IN_GAME =
          this.game.players.filter((p) => MAFIA_FACTIONS.includes(p.faction))
            .length > 0;

        if (this.game.hasBeenDay == true) {
          if (ONE_NIGHT) {
            var deadTeam = this.game
              .deadPlayers()
              .filter(
                (p) => this.game.getRoleAlignment(p.role.name) == "Independent"
              );
            var deadCult = this.game
              .deadPlayers()
              .filter((p) => CULT_FACTIONS.includes(p.faction));
            var deadMafia = this.game
              .deadPlayers()
              .filter((p) => MAFIA_FACTIONS.includes(p.faction));
            if (
              (MAFIA_IN_GAME && deadMafia.length <= 0) ||
              this.game.deadPlayers().length <= 0
            )
              return;
            if (
              (CULT_IN_GAME && deadCult.length <= 0) ||
              this.game.deadPlayers().length <= 0
            )
              return;
            if (deadTeam.length <= 0 || this.game.deadPlayers().length <= 0) {
              winners.addPlayer(this.player, this.name);
              return;
            }
          }
        }
        // win with majority
        const numIndependentAlive = this.game.players.filter(
          (p) =>
            p.alive && this.game.getRoleAlignment(p.role.name) == "Independent"
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
        if (this.game.IsBloodMoon) {
          this.player.queueAlert(
            "Because It is One Night mode, You win if no Independents are killed. If Mafia or Cult are present then will you will need one from each to be killed to win."
          );
        }
      },
    };
  }
};

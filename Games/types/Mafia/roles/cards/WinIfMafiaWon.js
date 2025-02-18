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

module.exports = class WinIfMafiaWon extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT + 2,
      againOnFinished: true,
      check: function (counts, winners) {
        let MafiaWon = false;

        for (let x = 0; x < MAFIA_FACTIONS.length; x++) {
          if (winners.groups[MAFIA_FACTIONS[x]]) {
            MafiaWon = true;
          }
        }

        if (MafiaWon) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };

    this.listeners = {
      handleWinWith: function (winners) {
        let MafiaWon = false;
        for (let x = 0; x < MAFIA_FACTIONS.length; x++) {
          if (winners.groups[MAFIA_FACTIONS[x]]) {
            MafiaWon = true;
          }
        }

        if (!MafiaWon) {
          winners.removeGroup(this.name);
        }
      },
    }
  }
};

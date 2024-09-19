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

module.exports = class WinInsteadOfMafiaAndCult extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT + 1,
      check: function (counts, winners, aliveCount) {

        if(!this.player.alive) return;

        let MafiaWon = false;
        let CultWon = false;

        for(let x = 0; x < MAFIA_FACTIONS.length; x++){
            if(winners.groups[MAFIA_FACTIONS[x]]){
                MafiaWon = true;
            }
        }
        for(let x = 0; x < CULT_FACTIONS.length; x++){
          if(winners.groups[CULT_FACTIONS[x]]){
              CultWon = true;
          }
      }

        if (MafiaWon) {
          winners.addPlayer(this.player, this.player.role.name);
          winners.removeGroup("Mafia");
        }
        if (CultWon) {
          winners.addPlayer(this.player, this.player.role.name);
          winners.removeGroup("Cult");
        }
      },
    };
  }
};

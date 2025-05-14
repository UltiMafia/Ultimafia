const Effect = require("../Effect");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../const/Priority");
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

module.exports = class Evil extends Effect {
  constructor(lifespan) {
    super("Evil");
    this.lifespan = lifespan || Infinity;

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (confirmedFinished && !winners.groups["Village"] && !winners.groups["Evil"]) {
          this.player.role.data.WinWith = true;
          winners.addPlayer(this.player, "Evil");
        }
        else if(aliveCount == 2 && this.player.alive){
          winners.addPlayer(this.player, "Evil");
        }
      },
    };

      this.listeners = {
      handleWinWith: function (winners) {
        if(winners.groups["Evil"] && this.player.role.data.WinWith != true){

        for(let player of this.game.players){
          if(EVIL_FACTIONS.includes(player.faction)){
            winners.addPlayer(player, player.faction)
          }
        }
      }
      },
    };

  }
};

const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");
const { EVIL_FACTIONS } = require("../../const/FactionList");

module.exports = class EvilsWinIfHalfSenators extends Card {
  constructor(role) {
    super(role);

this.winCheckSpecial = {
      priority: PRIORITY_WIN_CHECK_DEFAULT+1,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        //let senators = this.game.players.filter((p) => p.role.name == "Senator");
        //let aliveSenators = this.game.alivePlayers().filter((p) => p.role.name == "Senator");
          var hasSenators = false;
          var senatorCount = 0;
          for (let p of this.game.players) {
            if (p.role.name == "Senator") {
              hasSenators = true;
              senatorCount += p.alive ? 1 : -1;
            }
          }

          if (hasSenators && senatorCount <= 0) {
          for(let player of this.game.players){
            if(EVIL_FACTIONS.includes(player.faction)){
              winners.addPlayer(player, player.faction);
            }
          }
      }
    },
  };
};
};

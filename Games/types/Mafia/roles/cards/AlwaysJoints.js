const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");
const { CULT_FACTIONS, MAFIA_FACTIONS } = require("../../const/FactionList");

module.exports = class AlwaysJoints extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      actionsNext: function (){
        this.data.WinInstantKill = false;
      },
      instantAction: function (){
        this.data.WinInstantKill = true;
      },
      handleWinLater: function (winners) {
        if (this.player.role.alignment != "Independent") {
          return;
        }

        if(!this.game.WillWinLater){
          this.game.WillWinLater = [];
        }

        if(winners.findPlayerGroup(this.player)){
          let group = winners.findPlayerGroup(this.player);
          if(!this.game.WillWinLater.includes([this.player, group])){
          this.game.WillWinLater.push([this.player, group]);
          }
          winners.removePlayer(this.player, group);
          if(this.player.alive){
            this.game.sendAlert(`${this.player.name} has achieved their goals and ascends to a new plane of existance!`);
            this.player.kill("victory", this.actor, this.data.WinInstantKill);
          }
          
      
        }
      },
    };
  }
};

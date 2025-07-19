const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");
const { CULT_FACTIONS, EVIL_FACTIONS } = require("../../const/FactionList");

module.exports = class EvilsWinWhenKilled extends Card {
  constructor(role) {
    super(role);



      this.winCheckSpecial = {
      priority: PRIORITY_WIN_CHECK_DEFAULT+1,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
   
            
              
        if (this.killedPresident) {
          for(let player of this.game.players){
            if(EVIL_FACTIONS.includes(player.faction)){
              winners.addPlayer(player, player.faction);
            }
          }
        }
      },
    };

        this.listeners = {
        death: function (player, killer, deathType) {

          if(player != this.player){
            return;
          }

          if(!this.player.hasAbility(["Win-Con", "WhenDead"])){
            return;
          }

        let otherPresidents = this.game.alivePlayers().filter((p) => p != this.player && ((p.role.name == "President" && p.hasAbility(["Win-Con", "WhenDead"])) || p.role.data.RoleTargetBackup == "President"));
        if(otherPresidents.length > 0){
          return;
        }

          
       
      this.killedPresident = true;
      },
    };

  }
};

const Card = require("../../Card");
const { PRIORITY_DAY_EFFECT_DEFAULT } = require("../../const/Priority");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");
const { CULT_FACTIONS, EVIL_FACTIONS } = require("../../const/FactionList");

module.exports = class VillageWinsWhenKilled extends Card {
  constructor(role) {
    super(role);



      this.winCheckSpecial = {
      priority: PRIORITY_WIN_CHECK_DEFAULT+1,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
  
              
        if (this.player.role.killedAssassin) {
          for(let player of this.game.players){
            if(player.faction == "Village"){
              winners.addPlayer(player, player.faction);
            }
          }
        }
      },
    };

        this.listeners = {
        death: function (player, killer, deathType) {

          if(player.role.name == "President"){
            this.killedPresident = true;
          }

          if(player != this.player){
            return;
          }
          
          if(this.killedPresident == true){
            return;
          }


        let otherAssassins = this.game.alivePlayers().filter((p) => p != this.player && ((p.role.name == "Assassin" && p.hasAbility(["Win-Con", "WhenDead"])) || p.role.data.RoleTargetBackup == "Assassin"));
        if(otherAssassins.length > 0){
          return;
        }

          
       
      this.killedAssassin = true;
      },
    };

  }
};

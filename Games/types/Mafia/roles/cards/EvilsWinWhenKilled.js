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

          if(!this.player.hasEffect("PresidentEffect")){
            return;
          }

          
       
      this.killedPresident = true;
      },
      AbilityToggle: function (player) {
        if(!this.player.alive){
        return;
        }
        let checks = true;
        for(let player of this.game.alivePlayers()){
          for(let effect of player.effects){
            if(effect.name == "BackUp"){
              if(effect.BackupRole && `${effect.BackupRole}` === `${this.name}` && effect.CurrentRole.hasAbility(["Convert", "OnlyWhenAlive", "Modifier"])){
                checks = false;
              }
            }
          }
        }
        if(!this.hasAbility(["Win-Con", "WhenDead"])){
          checks = false;
        }
        
        
        if (checks == true) {
          if (
            this.PresEffect == null ||
            !this.player.effects.includes(this.PresEffect)
          ) {
            this.PresEffect = this.player.giveEffect("PresidentEffect", Infinity);
            this.passiveEffects.push(this.PresEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.PresEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.PresEffect != null) {
            this.PresEffect.remove();
            this.PresEffect = null;
          }
        }
      },
    };

  }
};

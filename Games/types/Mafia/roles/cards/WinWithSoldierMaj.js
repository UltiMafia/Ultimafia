const Card = require("../../Card");
const { PRIORITY_DAY_EFFECT_DEFAULT } = require("../../const/Priority");
const { CULT_FACTIONS,
      EVIL_FACTIONS,
      } = require("../../const/FactionList");

module.exports = class WinWithSoldierMaj extends Card {
  constructor(role) {
    super(role);


/*
      this.winCheckSpecial = {
      priority: PRIORITY_WIN_CHECK_DEFAULT+1,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if(!this.hasAbility(["Win-Con", "OnlyWhenAlive"])){
          return;
        }
        const seersInGame = this.game.players.filter(
          (p) => p.role.name == "Seer"
        );

        //Guessed Seer Conditional
        if (this.player.faction == "Village") {
          if (seersInGame.length > 0) {
            for (let x = 0; x < EVIL_FACTIONS.length; x++) {
              if (
                seersInGame.length == this.game.guessedSeers[EVIL_FACTIONS[x]]?.length
              ) {
                //seers have been guessed, village cannot win
                return;
              }
            }
          }
        }


        
        //Village Soldier Win
        if (this.player.faction == "Village") {
          if (
            this.game
              .alivePlayers()
              .filter(
                (p) =>
                  p.hasEffect("SoldierEffect")
              ).length >=
              aliveCount / 2 &&
            aliveCount > 0
          ) {
          for(let player of this.game.players){
            if(CULT_FACTIONS.includes(player.faction)){
              winners.addPlayer(player, player.faction);
            }
          }
            return;
          }
        }
      },
    };
*/

    this.listeners = {
      AbilityToggle: function (player) {
        if(!this.player.alive){
        return;
        }
        let checks = true;
        if(!this.hasAbility(["Win-Con", "OnlyWhenAlive"])){
          checks = false;
        }
        
        
        if (checks == true) {
          if (
            this.SoldierEffect == null ||
            !this.player.effects.includes(this.SoldierEffect)
          ) {
            this.SoldierEffect = this.player.giveEffect("SoldierEffect", Infinity);
            this.passiveEffects.push(this.SoldierEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.SoldierEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.SoldierEffect != null) {
            this.SoldierEffect.remove();
            this.SoldierEffect = null;
          }
        }
      },
    };



    };

  };

const Card = require("../../Card");
const { PRIORITY_DAY_EFFECT_DEFAULT } = require("../../const/Priority");
const { CULT_FACTIONS,
      EVIL_FACTIONS,
      } = require("../../const/FactionList");

module.exports = class WinWithSoldierMaj extends Card {
  constructor(role) {
    super(role);



      this.winCheckSpecial = {
      priority: PRIORITY_WIN_CHECK_DEFAULT+1,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if(!this.hasAbility(["Win-Con", "OnlyWhenAlive"]){
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
                  p.role.name === "Soldier" &&
                  p.hasAbility(["Win-Con", "OnlyWhenAlive"])
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
      },
    };

  }
};

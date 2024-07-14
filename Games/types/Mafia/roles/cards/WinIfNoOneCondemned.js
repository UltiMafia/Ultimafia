const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfNoOneCondemned extends Card {
  constructor(role) {
    super(role);

     this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT -1,
        run: function () {
          if (!this.actor.alive) return;
          if (this.game.getStateName() != "Night") return;
          if (this.game.alivePlayers() != 3 ) return;

         this.actor.queueAlert(
            `Now that only 3 players are alive today, Town will win if no one is executed Today!`
          );
          this.actor.role.data.MayorWin = true;

        },
      },
    ];

    this.listeners = {
      death: function (player, killer, deathType) {
          if (this.game.alivePlayers() != 3 || !this.actor.alive || this.player == this.actor){
            return;
          }
          if(deathType == "condemn" || this.game.getStateName() != "Day"){
          return;
          }
            this.actor.queueAlert(
            `Now that only 3 players are alive today, Town will win if no one is executed Today!`
          );
            this.actor.role.data.MayorWin = true;
          
        
        
      },
    };
  }
};

const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfNoOneCondemned extends Card {
  constructor(role) {
    super(role);

     this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT -3,
        run: function () {
          if (!this.actor.alive) return;
          if (this.game.alivePlayers().length != 3 ){
            this.actor.role.data.MayorWin = 0;
            return;
          };
          if (this.game.getStateName() == "Night" && this.actor.role.data.MayorWin == 0){
            this.actor.queueAlert(
              `Now that only 3 players are alive today, Town will win if no one is executed Today!`
            );
            this.actor.role.data.MayorWin = 1;
            return;
          }

        },

      },
    ];

    this.listeners = {
      
      death: function (player, killer, deathType) {
          if (this.game.alivePlayers().length != 3 || !this.player.alive || player == this.player){
            return;
          }
          if(deathType == "condemn" || this.game.getStateName() != "Day"){
          return;
          }
            this.actor.queueAlert(
            `Now that only 3 players are alive today, Town will win if no one is executed Today!`
          );
            this.actor.role.data.MayorWin = 2;
      },
    };
  }
};

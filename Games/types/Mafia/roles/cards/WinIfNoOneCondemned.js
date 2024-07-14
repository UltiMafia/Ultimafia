const Card = require("../../Card");
const { PRIORITY_DAY_EFFECT_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfNoOneCondemned extends Card {
  constructor(role) {
    super(role);

     this.actions = [
      {
        priority: PRIORITY_DAY_EFFECT_DEFAULT;,
        run: function () {
          if (!this.actor.alive) return;
          if (this.game.alivePlayers().length != 3 ){
            this.actor.role.data.MayorWin = false;
            return;
          };
          if (this.game.getStateName() == "Day"){
            let alivePlayers = this.game.alivePlayers();

            for(let x = 0; x<this.game.alivePlayers().length;x++){
            for (let action of this.game.actions[0]){
            if (action.target == alivePlayers [x] && action.hasLabel("condemn"))
              return;
            }
            }
            /*
            this.actor.queueAlert(
              `Now that only 3 players are alive today, Town will win if no one is executed Today!`
            );
            */
            this.actor.role.data.MayorWin = true;
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
          if(deathType == "condemn" || this.game.getStateName() != "Night"){
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

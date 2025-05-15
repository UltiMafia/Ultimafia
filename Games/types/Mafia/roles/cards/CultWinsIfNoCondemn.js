const Card = require("../../Card");
const { PRIORITY_DAY_EFFECT_DEFAULT } = require("../../const/Priority");

module.exports = class CultWinsIfNoCondemn extends Card {
  constructor(role) {
    super(role);



      this.winCheckSpecial = {
      priority: PRIORITY_WIN_CHECK_DEFAULT+1,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if(!this.player.hasAbility(["Win-Con", "OnlyWhenAlive"]){
          return;
        }
        const enemyMayors = this.game
          .alivePlayers()
          .filter(
            (p) =>
              p.role.name === "Mayor" &&
              p.role.data.MayorWin &&
              p.faction != this.player.faction &&
              p.hasAbility(["Win-Con", "OnlyWhenAlive"])
          );
            
              
        if (this.actor.role.data.NyarlathotepWin && this.player.hasAbility(["Win-Con"]) && aliveCount == 3) {
          for(let player of this.game.players){
            if(player.faction == this.player.faction){
              winners.addPlayer(player, player.faction);
            }
          }
        }
      },
    };

    this.actions = [
      {
        priority: PRIORITY_DAY_EFFECT_DEFAULT + 1,
        run: function () {
          if (!this.actor.alive) return;
          if (
            this.game.getStateName() == "Day" ||
            this.game.getStateName() == "Dusk"
          ) {
            let alivePlayers = this.game.players.filter((p) => p.role);

            for (let x = 0; x < alivePlayers.length; x++) {
              for (let action of this.game.actions[0]) {
                if (
                  action.target == alivePlayers[x] &&
                  action.hasLabel("condemn")
                ) {
                  this.actor.role.data.NyarlathotepWin = false;
                  return;
                }
              }
            }
            /*
            this.actor.queueAlert(
              `Now that only 3 players are alive today, Town will win if no one is executed Today!`
            );
            */
            this.actor.role.data.NyarlathotepWin = true;
            return;
          }
        },
      },
    ];
  }
};

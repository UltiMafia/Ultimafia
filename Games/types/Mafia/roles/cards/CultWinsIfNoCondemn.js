const Card = require("../../Card");
const { PRIORITY_DAY_EFFECT_DEFAULT } = require("../../const/Priority");

module.exports = class CultWinsIfNoCondemn extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_DAY_EFFECT_DEFAULT + 1,
        run: function () {
          if (!this.actor.alive) return;
          if (this.game.getStateName() == "Day" || this.game.getStateName() == "Dusk") {
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

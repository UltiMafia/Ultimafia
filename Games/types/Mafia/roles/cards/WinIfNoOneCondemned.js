const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfNoOneCondemned extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        if (aliveCount = 3 && this.player.alive){
          if (this.game.getStateName() == "Day"){
            this.actor.queueAlert(
            `Now that only 3 players are alive today, Town will win if no one is executed Today!`
          );
            this.actor.role.data.MayorWin = true;
          }
        }
      },
    };
  }
};

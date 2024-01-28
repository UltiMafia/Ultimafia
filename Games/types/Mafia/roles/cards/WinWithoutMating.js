const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithoutMating extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT + 1,
      check: function (counts, winners, aliveCount) {
        //panda solo win
        if (
          this.player.alive && this.player.role.data.mated <= 2 &&
          counts["Village"] == aliveCount &&
          aliveCount > 0
        ) {
          winners.addPlayer(this.player, this.player.role.name);
          winners.removeGroup("Village");
        }
        //panda loss due to sex
        if (
          this.player.alive && this.player.role.data.mated >= 2 &&
          counts["Village"] == aliveCount &&
          aliveCount > 0
        ) {
          winners.addPlayer(this.player, "Village");
        }
      },
    };

    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }

        if (!stateInfo.name.match(/Day/)) {
          return;
        }

        this.game.queueAlert(
          ":panda: The village's zoo has received two beautiful Panda Bears from a neighboring nation. Whatever the crisis you have found yourself in, you must ensure that the Panda Bears mate before they are sent home!"
        );
      },
    };
  }
};

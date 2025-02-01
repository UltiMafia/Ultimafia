const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithTwoGambleWins extends Card {
  constructor(role) {
    super(role);

    this.killer = null;
    role.data.gamblerWins = 0;
    if (this.game.players.length <= 7) {
      role.data.killsToWin = 1;
    } else if (this.game.players.length <= 11) {
      role.data.killsToWin = 2;
    } else {
      role.data.killsToWin = 3;
    }
    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount) {
        if (
          this.player.alive &&
          (this.player.role.data.gamblerWins >= this.data.killsToWin ||
            aliveCount === 2)
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};

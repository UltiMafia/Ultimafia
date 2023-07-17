const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithTwoGambleWins extends Card {
  constructor(role) {
    super(role);

    this.killer = null;
    role.data.gamblerWins = 0;
    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount) {
        if (
          this.player.alive &&
          (this.player.role.data.gamblerWins >= 2 || aliveCount === 2)
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};

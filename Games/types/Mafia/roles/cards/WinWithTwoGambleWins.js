const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithTwoGambleWins extends Card {
  constructor(role) {
    super(role);

    role.gambleWins = 0;
    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        if (
          this.player.alive &&
          !winners.groups[this.name] &&
          (this.gambleWins >= 2 || aliveCount == 1)
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};

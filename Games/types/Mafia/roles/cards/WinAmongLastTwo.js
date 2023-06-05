const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinAmongLastTwo extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        if (aliveCount <= 2 && this.player.alive)
          winners.addPlayer(this.player, this.name);
      },
    };
  }
};

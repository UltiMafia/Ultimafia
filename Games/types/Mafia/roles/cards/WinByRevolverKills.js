const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinByRevolverKills extends Card {
  constructor(role) {
    super(role);

    role.timebombKills = 0;
    role.data.killsToWin = 3;
    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        if (
          this.player.alive &&
          (this.timebombKills >= this.data.killsToWin || aliveCount <= 2)
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};

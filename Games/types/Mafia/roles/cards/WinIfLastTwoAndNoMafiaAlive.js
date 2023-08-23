const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfLastTwoAndNoMafiaAlive extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount) {
        if (
          this.player.alive &&
          aliveCount <= 2 &&
          (!counts["Mafia"] || counts["Mafia"] == 0)
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};

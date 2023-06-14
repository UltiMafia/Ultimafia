const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfAlive extends Card {
  constructor(role) {
    super(role);

    this.winCount = "Village";
    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check(counts, winners, aliveCount, confirmedFinished) {
        if (
          this.player.alive &&
          ((!confirmedFinished && counts.Village == aliveCount) || // Only Suvivors remain
            (confirmedFinished && !winners.groups[this.name]))
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};

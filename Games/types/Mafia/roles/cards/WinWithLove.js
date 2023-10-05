const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithLove extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (
          this.player.alive &&
          this.loves &&
          this.loves.alive &&
          ((!confirmedFinished && counts["Village"] == aliveCount) ||
            (confirmedFinished && !winners.groups[this.name]))
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};

const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfPairedLoversAlive extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (!this.player.alive || !this.pairedLovers) {
          return;
        }

        for (let lover of this.pairedLovers) {
          if (!lover.alive) {
            return;
          }
        }

        if (
          (!confirmedFinished && counts["Village"] == aliveCount) ||
          (confirmedFinished && !winners.groups[this.name])
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};

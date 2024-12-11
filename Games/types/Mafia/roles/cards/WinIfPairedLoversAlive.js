const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfPairedLoversAlive extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        this.player.queueAlert(
          "As above, so below. Observe the motions of the planets and find a pair of lovers that will rebuild this wretched town after it falls."
        );
      },
    };

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (!this.pairedLovers) {
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

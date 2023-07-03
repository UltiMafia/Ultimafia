const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinfIfPrescient extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (
          this.game.getStateInfo().dayCount == this.data.prediction &&
          ((!confirmedFinished && counts["Village"] == aliveCount) ||
            (confirmedFinished && !winners.groups[this.name]))
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};

const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinfIfPrescient extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (this.game.getStateInfo().dayCount != this.prediction) return;

        if (!confirmedFinished && counts["Village"] != aliveCount) return;

        winners.addPlayer(this.player, this.name);
      },
    };
  }
};

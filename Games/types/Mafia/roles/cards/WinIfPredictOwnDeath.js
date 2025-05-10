const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfPredictOwnDeath extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (this.nightKilled != true) return;

        winners.addPlayer(this.player, this.name);
      },
    };
    this.listeners = {
      death: function (player, killer, deathType) {
        if (
          player == this.player &&
          this.game.getStateInfo().dayCount == this.prediction
        ) {
          this.nightKilled = true;
        }
      },
    };
  }
};

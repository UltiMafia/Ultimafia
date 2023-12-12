const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfPredictOwnDeath extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (this.data.nightKilled = false) return;
        if (!confirmedFinished && counts["Village"] != aliveCount) return;

        winners.addPlayer(this.player, this.name);
      },
    };
    this.listeners = {
        death: function (player, killer, deathType) {
          if (
            player == this.player &&
            deathType == "basic" &&
            this.game.getStateName() == "Night" &&
            this.game.getStateInfo().daycount == this.prediction
          )
            this.data.nightKilled = true;
        },
      };
  }
};

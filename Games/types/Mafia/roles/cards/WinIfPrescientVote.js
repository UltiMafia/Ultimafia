const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinfIfPrescientVote extends Card {
  constructor(role) {
    super(role);

    role.predictedCorrect = 0;

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners) {
        if (
          this.player.alive &&
          !winners.groups[this.name] &&
          this.predictedCorrect >= 2
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };

    this.listeners = {
      death: function (player, killer, deathType) {
        if (
          player === this.predictedVote &&
          deathType === "condemn" &&
          this.player.alive
        ) {
          this.predictedCorrect += 1;
          this.actor.queueAlert(
            `The Village has condemned ${this.target.name} to death, enhancing your clairvoyant abilities.`
          );
        }
      },
    };
  }
};

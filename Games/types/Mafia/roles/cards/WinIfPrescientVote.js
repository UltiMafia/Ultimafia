const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinfIfPrescientVote extends Card {
  constructor(role) {
    super(role);

    role.predictedCorrect = 0;

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check(counts, winners) {
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
      death(player, killer, deathType) {
        if (
          player === this.predictedVote &&
          deathType === "lynch" &&
          this.player.alive
        ) {
          this.predictedCorrect += 1;
        }
      },
    };
  }
};

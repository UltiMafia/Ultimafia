const Card = require("../../Card");

module.exports = class WinWithGhost extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      check: function (counts, winners, aliveCount) {
        if (
          (aliveCount > 0 && counts["Ghost"] >= counts["Town"]) ||
          this.guessedWord === this.game.townWord
        ) {
          winners.addPlayer(this.player, "Ghost");
        }
      },
    };
  }
};

const Card = require("../../Card");

module.exports = class WinIfCorrectGuess extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      check: function (counts, winners, aliveCount) {
        if (
          (aliveCount == 1 && this.player.alive) ||
          (this.player.lastGuess &&
            this.player.lastGuess == this.player.getWordToGuess())
        ) {
          winners.addPlayer(this.player, this.player.name);
        }
      },
    };
  }
};

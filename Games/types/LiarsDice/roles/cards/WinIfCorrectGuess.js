const Card = require("../../Card");

module.exports = class WinIfCorrectGuess extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      check: function (counts, winners, aliveCount) {
        const lastAlive = aliveCount == 1 && this.player.alive;
        if (lastAlive) {
          winners.addPlayer(this.player, this.player.name);
          return;
        }

        const lastGuess = this.player.lastGuess;
        if (!lastGuess) {
          return;
        }

        const guessedCorrectly =
          this.player.lastGuess == this.player.getWordToGuess();
        if (guessedCorrectly) {
          winners.addPlayer(this.player, this.player.name);
          return;
        }

        const guessedAnagrams =
          this.game.winOnAnagrams &&
          this.player.getNumAnagramsGuessed() >= this.game.numAnagramsRequired;
        if (guessedAnagrams) {
          winners.addPlayer(this.player, this.player.name);
          this.game.queueAlert(
            `${this.player.name} has guessed enough anagrams.`
          );
          this.player.wonByAnagram = true;
          return;
        }
      },
    };
  }
};

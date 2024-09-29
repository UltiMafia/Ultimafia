const Card = require("../../Card");

module.exports = class WinWithGhost extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      check: function (counts, winners, aliveCount) {
        if (!this.player.alive) {
          return;
        }

        // win with majority or guessed word is correct
        const numGhostAlive = this.game.players.filter(
          (p) => p.alive && p.role.name == "Ghost"
        ).length;
        if ( (aliveCount > 0 && numGhostAlive >= aliveCount / 2) ||
        this.guessedWord === this.game.townWord ) {
          winners.addPlayer(this.player, this.name);
          return;
        }
      },
    };
  }
};

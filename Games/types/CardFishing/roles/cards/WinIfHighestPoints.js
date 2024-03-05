const Card = require("../../Card");

module.exports = class WinIfHighestPoints extends Card {
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
        if (this.game.drawDiscardPile.getDrawPileSize() === 0) {
          let highestPlayers = this.game.determineHighScore();
          if (highestPlayers.include(this.player)) {
            winners.addPlayer(this.player, this.player.name);
            return;
          }
        }
      },
    };
  }
};

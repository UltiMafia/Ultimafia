const Card = require("../../Card");

module.exports = class WinIfEmptyStack extends Card {
  constructor(role) {
    super(role);
    this.winCheck = {
      priority: 0,
      check: function (counts, winners, aliveCount) {
        const game = this.player.game;
        if (!game.isWell) return;
        if (this.player.cardStack && this.player.cardStack.length === 0) {
          winners.addPlayer(this.player, this.player.name);
        }
      },
    };
  }
};
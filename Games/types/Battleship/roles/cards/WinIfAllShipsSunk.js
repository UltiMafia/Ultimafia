const Card = require("../../Card");

module.exports = class WinIfAllShipsSunk extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      check: function (counts, winners, aliveCount) {
        if (this.game.hasWon(this.player)) {
          winners.addPlayer(this.player, this.player.name);
        }
      },
    };
  }
};

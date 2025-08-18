const Card = require("../../Card");

module.exports = class WinIfFourInARow extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      check: function (counts, winners, aliveCount) {
        if (this.player.Has4InaRow == true) {
          winners.addPlayer(this.player, this.player.name);
          return;
        }
        const lastAlive = this.game
          .alivePlayers()
          .filter((p) => p.role.name != "Host");
        if (lastAlive.length == 1 && this.player.alive) {
          winners.addPlayer(this.player, this.player.name);
          return;
        }
      },
    };
  }
};

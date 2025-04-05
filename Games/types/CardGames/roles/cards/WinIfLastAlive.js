const Card = require("../../Card");

module.exports = class WinIfLastAlive extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      check: function (counts, winners, aliveCount) {
        let nonHostAlive = this.game
          .alivePlayers()
          .filter((p) => p.role.name != "Host");

        if (nonHostAlive.length <= 1 && this.player.alive)
          winners.addPlayer(this.player, this.name);
      },
    };
  }
};

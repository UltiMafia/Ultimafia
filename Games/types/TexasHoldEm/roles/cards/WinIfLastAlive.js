const Card = require("../../Card");

module.exports = class WinIfLastAlive extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      check: function (counts, winners, aliveCount) {
        if (
          this.game.MaxRounds != 0 &&
          this.game.RoundNumber > this.game.MaxRounds
        ) {
          let min = 0;
          let maxPlayer;
          for (let player of this.game.players) {
            if (player.alive) {
              if (player.Chips > min) {
                maxPlayer = player;
                min = player.Chips;
              }
            }
          }
          if (maxPlayer == this.player) {
            winners.addPlayer(this.player, this.name);
          }
        }

        let nonHostAlive = this.game
          .alivePlayers()
          .filter((p) => p.role.name != "Host");

        if (nonHostAlive.length <= 1 && this.player.alive)
          winners.addPlayer(this.player, this.name);
      },
    };
  }
};

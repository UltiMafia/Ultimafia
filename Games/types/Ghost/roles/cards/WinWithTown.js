const Card = require("../../Card");

module.exports = class WinWithTown extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      check: function (counts, winners, aliveCount) {
        if (
          aliveCount > 0 &&
          counts["Town"] + this.game.numHostInGame == aliveCount
        )
          winners.addPlayer(this.player, "Town");
      },
    };
  }
};

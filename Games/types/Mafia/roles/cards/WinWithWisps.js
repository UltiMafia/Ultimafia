const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithWisps extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        // win with majority
        const numWispAlive = this.game.players.filter(
          (p) => p.alive && p.role.name == "Wisp"
        ).length;
        if (aliveCount > 0 && numWispAlive >= aliveCount / 2) {
          winners.addPlayer(this.player, this.name);
          return;
        }
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.player.queueAlert(
          ":scream: You must ensure a wisp survives until the end."
        );
      },
    };
  }
};

const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinUponPyromaniacMajority extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        if (!this.player.alive) {
          return;
        }

        // win with majority
        const numPyromaniacAlive = this.game.players.filter(
          (p) => p.alive && p.role.name == "Pyromaniac"
        ).length;
        if (aliveCount > 0 && numPyromaniacAlive >= aliveCount / 2) {
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
          "With your reusable matches, you plan to burn down this wretched town!"
        );
      },
    };
  }
};

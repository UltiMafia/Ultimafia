const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithDeepOnes extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT + 1,
      check: function (counts, winners, aliveCount) {
        if (!this.player.alive) {
          return;
        }

        // win with majority
        const numFishAlive = this.game.players.filter(
          (p) => p.alive && p.role.name == "Deep One"
        ).length;
        if (aliveCount > 0 && numFishAlive >= aliveCount / 2) {
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
          "The primate Cultists have summoned you from Y'ha-nthlei to serve their Dark Gods. Instead, your hellish hybrids will cast a long shadow over this town."
        );
      },
    };
  }
};

const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithGliders extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        // win with majority
        const numGliderAlive = this.game.players.filter(
          (p) => p.alive && p.role.name == "Glider"
        ).length;
        if (aliveCount > 0 && numGliderAlive >= aliveCount / 2) {
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
          ":scream: You must ensure a Glider survives until the end."
        );
      },
    };
  }
};

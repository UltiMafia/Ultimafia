const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinFourPolarisedDeaths extends Card {
  constructor(role) {
    super(role);

    role.polarisedKills = 0;
    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        if (!this.player.alive) {
          return;
        }

        // win with polarised kills
        if (this.polarisedKills >= 4) {
          winners.addPlayer(this.player, this.name);
          return;
        }

        // win with majority
        const numBearAlive = this.game.players.filter(
          (p) => p.alive && p.role.name == "Polar Bear"
        ).length;
        if (aliveCount > 0 && numBearAlive >= aliveCount / 2) {
          winners.addPlayer(this.player, this.name);
          return;
        }
      },
    };

    this.listeners = {
      death: function (player, killer, deathType, instant) {
        if (
          this.player.alive &&
          deathType === "polarised" &&
          player !== this.player
        ) {
          this.polarisedKills += 1;
        }
      },
    };
  }
};

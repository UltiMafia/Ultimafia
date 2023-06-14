const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinAllProbed extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check(counts, winners, aliveCount) {
        let probeCount = 0;

        for (const player of this.game.players) {
          const isProbed = player.hasItem("Probe");

          if (player.alive && (isProbed || player.role.name === "Alien"))
            probeCount++;
        }

        if (probeCount === aliveCount)
          winners.addPlayer(this.player, this.name);
      },
    };
  }
};

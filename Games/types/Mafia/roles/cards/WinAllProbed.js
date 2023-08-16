const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinAllProbed extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        var probeCount = 0;

        for (let player of this.game.players) {
          let isProbed = player.hasItem("Probe");

          if (player.alive && (isProbed || player.role.name === "Alien"))
            probeCount++;
        }

        if (probeCount === aliveCount)
          winners.addPlayer(this.player, this.name);
      },
    };
    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.player.queueAlert(
          "Your mission is to probe as many humans as you can before the Mothership arrives. Do not let their politics get in your way."
        );
      },
    };
  }
};

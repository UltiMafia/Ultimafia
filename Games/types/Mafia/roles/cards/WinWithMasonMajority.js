const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithMasonMajority extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT + 1,
      check: function (counts, winners, aliveCount) {
        const numMasonAlive = this.game.players.filter(
          (p) =>
            p.alive &&
            (p.role.name == "Freemason" || p.role.name == "Palladist")
        ).length;
        if (
          this.player.alive &&
          counts["Village"] == aliveCount &&
          aliveCount > 0 &&
          numMasonAlive >= aliveCount / 2
        ) {
          winners.addPlayer(this.player, this.player.role.name);
          winners.removeGroup("Village");
        }
      },
    };

    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }

        if (!stateInfo.name.match(/Day/)) {
          return;
        }

        this.game.queueAlert(
          "The Masonic Lodge was once a respected institution, but infiltration by a Palladist could spell disaster for the Village..."
        );
      },
    };
  }
};

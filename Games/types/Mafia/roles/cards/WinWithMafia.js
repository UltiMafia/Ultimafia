const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithMafia extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        const hasMajority = counts["Mafia"] >= aliveCount / 2 && aliveCount > 0;
        if (hasMajority) {
          winners.addPlayer(
            this.player,
            this.player.role.alignment === "Mafia"
              ? "Mafia"
              : this.player.role.name
          );
        }

        var hasDignitaries = false;
        var dignitaryCount = 0;
        for (let p of this.game.players) {
          if (p.role.name == "Dignitary") {
            hasDignitaries = true;
            dignitaryCount += p.alive ? 1 : -1;
          }
        }

        if (hasDignitaries && dignitaryCount <= 0) {
          winners.addPlayer(
            this.player,
            this.player.role.alignment == "Mafia"
              ? "Mafia"
              : this.player.role.name
          );
        }
      },
    };
    this.listeners = {
      start: function () {
        if (this.oblivious["Mafia"]) return;

        for (let player of this.game.players) {
          if (
            player.role.alignment === "Mafia" &&
            player !== this.player &&
            player.role.name !== "Politician" &&
            !player.role.oblivious["self"]
          ) {
            this.revealToPlayer(player);
          }
        }
      },
    };
  }
};

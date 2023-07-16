const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithMafia extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        if (counts["Mafia"] >= aliveCount / 2 && aliveCount > 0 ||
        (this.game.players.filter(e => e.role.name === "Dignitary").length > 0 &&
            this.game.players.filter(e => e.role.name === "Dignitary" && e.alive) <
            this.game.players.filter(e => e.role.name === "Dignitary" && !e.alive))
    ) {
        winners.addPlayer(this.player, this.player.role.alignment == "Mafia" ? "Mafia" : this.player.role.name);
    }
      },
    };
    this.listeners = {
      start: function () {
        if (this.oblivious["Mafia"]) return;

        for (let player of this.game.players) {
          if (
            player.role.alignment == "Mafia" &&
            player != this.player &&
            !player.role.oblivious["self"]
          ) {
            this.revealToPlayer(player);
          }
        }
      },
    };
  }
};

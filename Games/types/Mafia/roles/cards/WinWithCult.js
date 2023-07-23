const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithCult extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        if (counts["Cult"] >= aliveCount / 2 && aliveCount > 0)
          winners.addPlayer(this.player, "Cult");
      },
    };
    this.listeners = {
      start: function () {
        if (this.oblivious["Cult"]) return;

        for (let player of this.game.players) {
          if (
            player.role.alignment === "Cult" &&
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

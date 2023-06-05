const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithMonsters extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        if (counts["Monsters"] >= aliveCount / 2 && aliveCount > 0)
          winners.addPlayer(this.player, "Monsters");
      },
    };
    this.listeners = {
      start: function () {
        if (this.oblivious["Monsters"]) return;

        for (let player of this.game.players) {
          if (
            player.role.alignment == "Monsters" &&
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

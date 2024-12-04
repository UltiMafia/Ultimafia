const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithHounds extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        // win with majority
        const numHoundAlive = this.game.players.filter(
          (p) => p.alive && p.role.name == "Hellhound"
        ).length;
        if (aliveCount > 0 && numHoundAlive >= aliveCount / 2) {
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
          ":werewolf: You have been called up from the gates of the Abyss to feast on the living. Your master has given you one command: correctly guess your victim's role, lest your own be revealed in the public square."
        );
      },
    };
  }
};

const Card = require("../../Card");

module.exports = class RevealAllRoles extends Card {
  constructor(role) {
    super(role);

    role.methods = {
      revealPlayers: function () {
        for (const player of this.game.players) {
          if (player.alive) {
            player.role.revealToPlayer(this.player);
          }
        }
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player != this.player) {
          return;
        }
        this.methods.revealPlayers();
      },
    };
  }
};

const Card = require("../../Card");

module.exports = class WinWithFascists extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        for (let player of this.game.players) {
          if (
            player.role.alignment == "Fascists" &&
            player != this.player
          ) {
            this.revealToPlayer(player);
          }
        }
      },
    };

    this.winCheck = {
      priority: 0,
      check: function (winners) {
        if (this.game.fascistPolicyEnacted == 6 || this.game.hitlerChancellor == true) {
            winners.addPlayer(this.player, "Fascists");
        }
      },
    };
  }
};
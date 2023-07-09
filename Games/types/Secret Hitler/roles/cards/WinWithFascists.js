const Card = require("../../Card");

module.exports = class WinWithFascists extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        // hitler does not know other fascists with 7-10 players
        if (this.game.players.length > 6 && this.role == "Hitler") {
          return;
        }

        for (let player of this.game.players) {
          if (player.role.alignment == "Fascists" && player != this.player) {
            this.revealToPlayer(player);
          }
        }
      },
    };

    this.winCheck = {
      priority: 0,
      check: function (winners) {
        if (
          this.game.numFascistPolicyEnacted == 6 ||
          this.game.hitlerChancellor == true
        ) {
          winners.addPlayer(this.player, "Fascists");
        }
      },
    };
  }
};

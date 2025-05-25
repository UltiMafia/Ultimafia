const Card = require("../../Card");

module.exports = class KnowIsolde extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        for (let player of this.game.players) {
          if (player.role.appearance.tristan) {
            player.role.revealToPlayer(this.player, false, "tristan");
          }
        }
      },
    };
  }
};

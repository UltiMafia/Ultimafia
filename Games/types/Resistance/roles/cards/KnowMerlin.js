const Card = require("../../Card");

module.exports = class KnowMerlin extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        for (let player of this.game.players) {
          if (player.role.appearance.percival) {
            player.role.revealToPlayer(this.player, false, "percival");
          }
        }
      },
    };
  }
};

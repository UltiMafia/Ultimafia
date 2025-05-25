const Card = require("../../Card");

module.exports = class KnowTristan extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        for (let player of this.game.players) {
          if (player.role.appearance.isolde) {
            player.role.revealToPlayer(this.player, false, "isolde");
          }
        }
      },
    };
  }
};

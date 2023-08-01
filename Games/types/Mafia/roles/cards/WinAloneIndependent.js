const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinAloneIndependent extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners) {
        if (!this.player.alive) {
          return;
        }

        const independentsAlive = this.game.players.filter(
          (p) => p.alive && p.role.alignment === "Independent"
        );

        if (independentsAlive.length === 1) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};

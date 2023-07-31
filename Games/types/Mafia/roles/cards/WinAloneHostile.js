const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinAloneHostile extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners) {
        if (!this.player.alive) {
          return;
        }

        const hostilesAlive = this.game.players.filter(
          (p) =>
            p.alive &&
            p.role.alignment === this.alignment &&
            p.role.winCount !== "Village"
        );

        if (hostilesAlive.length === 1) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};

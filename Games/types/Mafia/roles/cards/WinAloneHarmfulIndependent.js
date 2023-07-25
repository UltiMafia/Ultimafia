const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinAloneHarmfulIndependent extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners) {
        if (!this.player.alive) {
          return;
        }

        const hostileIndependentsAlive = this.game.players.filter(
          (p) =>
            p.alive &&
            p.role.alignment === this.alignment &&
            p.role.winCount !== "Village"
        );

        if (hostileIndependentsAlive.length === 1) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};

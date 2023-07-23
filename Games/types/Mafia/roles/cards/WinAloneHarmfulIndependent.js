const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinAloneHarmfulIndependent extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (
          this.player.alive &&
          this.game.players.filter(
            (e) =>
              e.alive &&
              e.role.alignment === this.player.role.alignment &&
              e.role.winCount !== "Village"
          ).length === 1
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};

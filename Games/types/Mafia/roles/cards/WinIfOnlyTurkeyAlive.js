const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfOnlyTurkeyAlive extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check(counts, winners, aliveCount) {
        for (const player of this.game.players) {
          if (player.alive && player.role.name !== "Turkey") {
            return;
          }
        }

        winners.addPlayer(this.player, this.name);
      },
    };
  }
};

const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfLoveConquersAll extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check(counts, winners, aliveCount) {
        let loveCount = 0;

        for (const player of this.game.players) {
          const isInLove = player.hasEffect("Love");

          if (player.alive && (isInLove || player.role.name === "Matchmaker"))
            loveCount++;
        }

        if (loveCount === aliveCount) winners.addPlayer(this.player, this.name);
      },
    };
  }
};

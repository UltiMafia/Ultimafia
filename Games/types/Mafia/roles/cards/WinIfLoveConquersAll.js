const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfLoveConquersAll extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        var loveCount = 0;

        for (let player of this.game.players) {
          let isInLove = player.hasEffect("Love");

          if (player.alive && (isInLove || player.role.name === "Matchmaker"))
            loveCount++;
        }

        if (loveCount === aliveCount) winners.addPlayer(this.player, this.name);
      },
    };
  }
};

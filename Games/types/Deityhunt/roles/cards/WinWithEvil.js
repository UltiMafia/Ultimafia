const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithEvil extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        const hasMajority = ((counts["Deity"] + counts["Follower"]) >= aliveCount / 2 || aliveCount == (counts["Deity"] + counts["Follower"])) && aliveCount > 0;
        if (hasMajority) {
          winners.addPlayer(this.player, "Evil");
        }
      }
    };
    this.listeners = {
      start: function () {
        for (let player of this.game.players) {
          if (
            this.player.role.alignment == "Deity"
            && player.role.alignment == "Follower"
          ) {
            this.revealToPlayer(player);
          }
        }
        // add learning not in play characters
      },
    };
  }
};

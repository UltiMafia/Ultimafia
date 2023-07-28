const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithEvil extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        let followerCount = counts["Follower"] || 0;
        let leaderCount = counts["Leader"] || 0;

        const onlyEvil = (leaderCount + followerCount) >= aliveCount && aliveCount > 0;
        if (onlyEvil || this.game.evilWin) {
          winners.addPlayer(this.player, "Evil");
        }
      }
    };
    this.listeners = {
      start: function () {
        for (let player of this.game.players) {
          if (this.player.role.alignment == "Follower"
              && player.role.alignment == "Leader"
              && player != this.player) {
            this.evilReveal(player, "Follower");
          } 
          if (this.player.role.alignment == "Leader"
              && player.role.alignment == "Follower"
              && player != this.player){
            this.evilReveal(player, "Leader");
          }
        }
        // add learning not in play characters
        // can be good or evil
      },
    };
  }
};

const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithGood extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        let leaderCount = counts["Leader"] || 0;

        let leaderDead = this.game.deadPlayers().filter((p) => p.role.alignment == "Leader").length > 0
        
        if (this.game.shadow){
          let shadowsAlive = this.game.shadow.filter((p) => p.alive);
          if (shadowsAlive.length == 2) return;
        }
        
        if (leaderCount == 0 && leaderDead){
          winners.addPlayer(this.player, "Good");
        }
      },
    };
  }
};

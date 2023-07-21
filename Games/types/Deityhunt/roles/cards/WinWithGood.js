const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithGood extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        let deityDead = this.game.deadPlayers().filter((p) => p.role.alignment == "Deity").length > 0
        
        if (this.game.twin){
          twinsAlive = this.game.twin.filter((p) => p.alive);
          if (twinsAlive.length == 2) return;
        }
        
        if (counts["Deity"] == 0 && deityDead){
          winners.addPlayer(this.player, "Good");
        }
      },
    };
  }
};

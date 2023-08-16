const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinMafiaCultJoint extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT + 1,
      check: function (counts, winners, aliveCount) {
        if (
          this.player.alive &&
          counts["Mafia"] >= aliveCount / 2 && aliveCount > 0 || 
          counts["Cult"] >= aliveCount / 2 && aliveCount > 0
        ) {
          winners.addPlayer(this.player, this.player.role.name);
          winners.addGroup("Mafia");
          winners.addGroup("Cult");
        }
      },
    };
  }
};

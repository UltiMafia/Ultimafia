const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithVillage extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        if (counts.Village == aliveCount && aliveCount > 0) {
          winners.addPlayer(this.player, "Village");
        } else if (
          this.game.alivePlayers().filter((e) => e.role.name === "Soldier")
            .length >=
            aliveCount / 2 &&
          aliveCount > 0
        ) {
          winners.addPlayer(this.player, "Village");
        }
      },
    };
  }
};

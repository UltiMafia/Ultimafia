const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithVillage extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT + 1,
      check: function (counts, winners, aliveCount) {
        if (
          this.player.alive &&
          counts["Village"] == aliveCount &&
          aliveCount > 0
        ) {
          winners.addPlayer(this.player, this.player.role.name);
          winners.removeGroup("Village");
        }
      },
    };
  }
};

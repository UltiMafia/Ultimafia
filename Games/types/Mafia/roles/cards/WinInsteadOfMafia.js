const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinInsteadOfMafia extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT + 1,
      check(counts, winners, aliveCount) {
        if (
          this.player.alive &&
          counts.Mafia >= aliveCount / 2 &&
          aliveCount > 0
        ) {
          winners.addPlayer(this.player, this.player.role.name);
          winners.removeGroup("Mafia");
        }
      },
    };
  }
};

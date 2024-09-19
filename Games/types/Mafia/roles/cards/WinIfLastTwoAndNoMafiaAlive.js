const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");
const {
  CULT_FACTIONS,
  MAFIA_FACTIONS,
} = require("../../const/FactionList");

module.exports = class WinIfLastTwoAndNoMafiaAlive extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount) {

        let mafiaandcult = this.game.alivePlayers().filter((p) => (MAFIA_FACTIONS.includes(p.faction) || CULT_FACTIONS.includes(p.faction)) && this.game.getRoleAlignment(p.role.name) != "Independent")

        if (
          this.player.alive &&
          aliveCount <= 2 &&
          (mafiaandcult.length <= 0)
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};

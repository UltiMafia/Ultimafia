const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithMafiaOrCult extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT + 1,
      check: function (counts, winners) {
        if (!this.player.alive) return;

        if (winners.groups["Mafia"] || winners.groups["Cult"]) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};

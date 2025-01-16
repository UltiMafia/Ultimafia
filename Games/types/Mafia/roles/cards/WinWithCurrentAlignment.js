const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithCurrentAlignment extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT + 2,
      againOnFinished: true,
      check: function (counts, winners) {
        if (winners.groups[this.player.faction]) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};

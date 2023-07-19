const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithCurrentAlignment extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT + 1,
      againOnFinished: true,
      check: function (counts, winners) {
        if (this.player.alive && winners.groups[this.player.role.alignment]) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};

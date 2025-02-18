const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfVillageWon extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT + 2,
      againOnFinished: true,
      check: function (counts, winners) {
        if (winners.groups["Village"]) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };

    this.listeners = {
      handleWinWith: function (winners) {
        if (!winners.groups["Village"]) {
          winners.removeGroup(this.name);
        }
      },
    };
  }
};

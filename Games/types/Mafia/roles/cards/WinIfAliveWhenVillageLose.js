const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfAliveWhenVillageLose extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (winners, confirmedFinished) {
        if (
          this.player.alive &&
          confirmedFinished &&
          !winners.groups["Village"]
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};

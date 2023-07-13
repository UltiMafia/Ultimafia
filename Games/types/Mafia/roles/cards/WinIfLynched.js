const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT} = require("../../const/Priority");

module.exports = class WinIfLynched extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount) {
        if (this.data.lynched && !winners.groups[this.name]) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
    this.listeners = {
      death: function (player, killer, deathType) {
        if (player == this.player && deathType == "lynch")
          this.data.lynched = true;
      },
    };
  }
};

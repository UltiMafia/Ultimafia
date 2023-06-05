const Card = require("../../Card");
const { PRIORITY_WIN_IF_LYNCHED } = require("../../const/Priority");

module.exports = class WinIfLynched extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_IF_LYNCHED,
      againOnFinished: true,
      check: function (counts, winners, aliveCount) {
        if (this.data.lynched && !winners.groups[this.name]) {
          winners.addPlayer(this.player, this.name);
          return true;
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

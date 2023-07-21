const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfSaves extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (
          this.player.alive &&
          (this.data.deathStack?.length >= 4 ||
            this.data.savedPlayers?.length >= 2)
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
    this.listeners = {
      start: function () {
        this.data.deathStack = [];
      },
      state: function (stateInfo) {
        if (stateInfo.name.match(/(Night|Day)/)) {
          if (!this.data.deathStack) {
            this.data.deathStack = [];
          }
          this.data.deathStack.push(stateInfo.name);
        }
      },
      death: function (player) {
        this.data.deathStack = [];
      },
    };
  }
};
const Card = require("../../Card");
const { PRIORITY_WIN_BY_GETTING_SHOT } = require("../../const/Priority");

module.exports = class WinIfShot extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_BY_GETTING_SHOT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount) {
        if (this.data.shot && !winners.groups[this.name]) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
    this.listeners = {
      death: function (player, killer, deathType) {
        if (player == this.player && deathType == "gun") this.data.shot = true;
      },
    };
  }
};

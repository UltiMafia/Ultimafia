const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfNightKilled extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount) {
        if (this.data.nightKilled && !winners.groups[this.name]) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
    this.listeners = {
      death: function (player, killer, deathType) {
        if (player == this.player && deathType == "basic")
          this.data.nightKilled = true;
      },
    };
  }
};

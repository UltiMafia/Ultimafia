const Card = require("../../Card");
const { PRIORITY_WIN_IF_CONDEMNED } = require("../../const/Priority");

module.exports = class WinIfNightKilled extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_IF_CONDEMNED,
      againOnFinished: true,
      check: function (counts, winners) {
        if (this.data.nightKilled && !winners.groups[this.name]) {
          winners.addPlayer(this.player, this.name);
          return true;
        }
      },
    };
    this.listeners = {
      death: function (player, killer, deathType) {
        if (
          player == this.player &&
          deathType == "basic" &&
          this.game.getStateName() == "Night"
        )
          this.data.nightKilled = true;
      },
    };
  }
};

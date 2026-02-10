const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfTimebombKillsThree extends Card {
  constructor(role) {
    super(role);

    role.timebombKills = 0;
    if (this.game.players.length <= 7) {
      role.data.killsToWin = 2;
    } else if (this.game.players.length <= 11) {
      role.data.killsToWin = 3;
    } else {
      role.data.killsToWin = 4;
    }
    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        if (
          this.player.alive &&
          (this.timebombKills >= this.data.killsToWin || aliveCount == 2)
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };

    this.listeners = {
      death: function (player, killer, deathType, instant) {
        if (
          this.player.alive &&
          deathType === "bomb" &&
          killer === this.player &&
          player !== this.player
        ) {
          this.timebombKills += 1;
        }
      },
    };
  }
};

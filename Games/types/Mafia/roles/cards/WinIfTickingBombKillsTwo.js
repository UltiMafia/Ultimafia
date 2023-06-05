const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfTickingBombKillsTwo extends Card {
  constructor(role) {
    super(role);

    role.tickingBombKills = 0;
    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        if (
          this.player.alive &&
          !winners.groups[this.name] &&
          (this.tickingBombKills >= 2 || aliveCount == 1)
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
          this.tickingBombKills += 1;
        }
      },
    };
  }
};

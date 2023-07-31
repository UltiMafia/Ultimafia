const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinFourPolarisedDeaths extends Card {
  constructor(role) {
    super(role);

    role.polarisedKills = 0;
    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        if (
          this.player.alive &&
          !winners.groups[this.name] &&
          (this.polarisedKills >= 4 || aliveCount == 2)
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };

    this.listeners = {
      death: function (player, killer, deathType, instant) {
        if (
          this.player.alive &&
          deathType === "polarised" &&
          player !== this.player
        ) {
          this.polarisedKills += 1;
        }
      },
    };
  }
};

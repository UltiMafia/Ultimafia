const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinFourPolarisedDeaths extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount) {
        let polarisedPlayers = this.target.giveEffect("Polarised")

        if (this.player.alive && this.player.role.data.polarised === 4 || aliveCount === 2) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
  }
};

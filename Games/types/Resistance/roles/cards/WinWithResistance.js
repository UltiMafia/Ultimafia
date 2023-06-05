const Card = require("../../Card");

module.exports = class WinWithResistance extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      check: function (winners) {
        if (
          this.game.mission - 1 - this.game.missionFails >=
          this.game.numMissions / 2
        )
          winners.addPlayer(this.player, "Resistance");
      },
    };
  }
};

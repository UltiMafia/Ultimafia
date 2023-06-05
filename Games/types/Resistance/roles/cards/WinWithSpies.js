const Card = require("../../Card");

module.exports = class WinWithSpies extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      check: function (winners) {
        if (this.game.missionFails >= this.game.numMissions / 2)
          winners.addPlayer(this.player, "Spies");
      },
    };
  }
};

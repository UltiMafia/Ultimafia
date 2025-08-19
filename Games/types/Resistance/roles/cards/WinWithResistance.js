const Card = require("../../Card");

module.exports = class WinWithResistance extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      check: function (winners, Epilogue) {
        if (Epilogue == true) {
          return;
        }
        if (
          this.game.missionRecord.score["rebels"] >=
          Math.ceil(this.game.numMissions / 2)
        )
          winners.addPlayer(this.player, "Resistance");
      },
    };
  }
};

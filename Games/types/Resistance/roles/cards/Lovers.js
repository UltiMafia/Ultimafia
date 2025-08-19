const Card = require("../../Card");

module.exports = class Foresight extends Card {
  constructor(role) {
    super(role);
    role.game.hasEpilogue = true;
    this.stateMods = {
      Epilogue: {
        type: "add",
        index: 5,

        length: 1000 * 60,
        shouldSkip: function () {
          return !(
            this.game.mission - 1 - this.game.missionFails >=
            Math.ceil(this.game.numMissions / 2)
          );
        },
      },
    };
  }
};

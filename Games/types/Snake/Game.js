const Game = require("../../core/Game");
const Player = require("./Player");

module.exports = class GhostGame extends Game {
  constructor(options) {
    super(options);

    this.type = "Snake";
    this.Player = Player;
    this.states = [
      {
        name: "Postgame",
      },
      {
        name: "Pregame",
      },
      {
        name: "Day",
        length: options.settings.stateLengths["Day"]
      },
    ];
  }

  start() {

    super.start();
  }


  // process player leaving immediately
  async playerLeave(player) {
    await super.playerLeave(player);

  }

  async endGame(winners) {
    await super.endGame(winners);
  }
};

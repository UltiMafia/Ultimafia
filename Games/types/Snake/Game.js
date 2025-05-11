const Game = require("../../core/Game");
const Player = require("./Player");

module.exports = class SnakeGame extends Game {
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

    this.positions = {
      
    }

    for (const player of players){
      this.positions[player.id] = {
        direction: "up",
        segments: []
      }
    }

    setInterval(() => {
      this.broadcast("gameState", {a:1, b: 2})
    }, 1000)
  }

  start() {
    // for (const player of this.players){
    //     player.holdItem("Microphone")
    // }

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

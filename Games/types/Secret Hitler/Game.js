const Game = require("../../core/Game");
const Player = require("./Player");
const Action = require("./Action");
const Queue = require("../../core/Queue");
const Winners = require("../../core/Winners");
const Random = require("../../../lib/Random");

module.exports = class SecretHitlerGame extends Game {
  constructor(options) {
    super(options);

    this.type = "Secret Hitler";
    this.Player = Player;
    this.states = [
      {
        name: "Postgame",
      },
      {
        name: "Pregame",
      },
      {
        name: "Election",
        length: options.settings.stateLengths["Election"],
      },
      {
        name: "Legislative Session",
        length: options.settings.stateLengths["Legislative Session"],
      },
      {
        name: "Executive Action",
        length: options.settings.stateLengths["Executive Action"],
      },
    ];
  }

  checkWinConditions() {
    var finished = false;
    var counts = {};
    var winQueue = new Queue();
    var winners = new Winners(this);
    var aliveCount = this.alivePlayers().length;

    winners.determinePlayers();
    
    return [finished, winners];
  }
};

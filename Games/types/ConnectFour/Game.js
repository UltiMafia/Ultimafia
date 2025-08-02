const Game = require("../../core/Game");
const Action = require("./Action");
const Player = require("./Player");
const Queue = require("../../core/Queue");
const Winners = require("../../core/Winners");
const Random = require("../../../lib/Random");

module.exports = class ConnectFourGame extends Game {
  constructor(options) {
    super(options);

    this.type = "Connect Four";
    this.Player = Player;
    this.states = [
      {
        name: "Postgame",
      },
      {
        name: "Pregame",
      },
      {
        name: "Turn",
        length: options.settings.stateLengths["Turn"],
      },
    ];
    this.currentPlayerIndex = -1;
    this.boardX = options.settings.boardX;
    this.boardY = options.settings.boardY;
  }

  start() {
    this.currentPlayerIndex = Random.randInt(0, this.players.length - 1);
    super.start();
  }

  getStateInfo(state) {
    var info = super.getStateInfo(state);
    info.extraInfo = {
      boardInfo: {
        boardX: this.boardX,
        boardY: this.boardY,
      },
    };
    return info;
  }

  async playerLeave(player) {
    await super.playerLeave(player);

    if (this.started && !this.finished) {
      this.sendAlert("The game cannot continue as a player has left.");
      this.immediateEnd();
    }
  }

  checkWinConditions() {
    var finished = false;
    var winQueue = new Queue();
    var winners = new Winners(this);
    var aliveCount = this.alivePlayers().length;

    for (let player of this.players) {
      winQueue.enqueue(player.role.winCheck);
    }

    for (let winCheck of winQueue) {
      winCheck.check(winners);
    }

    if (winners.groupAmt() > 0) finished = true;
    else if (aliveCount == 0) {
      winners.addGroup("No one");
      finished = true;
    }

    winners.determinePlayers();
    return [finished, winners];
  }
};

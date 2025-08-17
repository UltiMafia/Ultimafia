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
    this.currentPlayer = undefined;
    this.board = [];

    this.boardX = options.settings.boardX;
    this.boardY = options.settings.boardY;
  }

  start() {
    //this.currentPlayerIndex = Random.randInt(0, this.players.length - 1);

    this.hasHost = this.setup.roles[0]["Host:"];
    if (this.hasHost) {
      let hostPlayer = this.players.array()[0];
      this.randomizedPlayers = Random.randomizeArray(
        this.players.array()
      ).filter((p) => p != hostPlayer);
    } else {
      this.randomizedPlayers = Random.randomizeArray(this.players.array());
    }
    this.randomizedPlayersCopy = this.randomizedPlayers;

    this.setupBoard(this.boardX, this.boardY);
    super.start();
  }

  incrementCurrentIndex() {
    this.currentIndex =
      (this.currentIndex + 1) % this.randomizedPlayersCopy.length;
  }

  incrementState() {
    let previousState = this.getStateName();
    console.log(this.spectatorMeetFilter);
    if (previousState == "Turn") {
      this.incrementCurrentIndex();
      this.sendAlert(
        `${this.randomizedPlayersCopy[this.currentIndex].name}'s Turn!`
      );
    }
    super.incrementState();
  }

  placeChip(player, column) {
    let colNum = parseInt(column);
    for (let i = 0; i < this.board[column].length; i++) {
      if (
        this.board[column][i + 1] != " " ||
        this.board[column][i + 1] == null
      ) {
        this.board[column][i] = player;
      }
    }
  }

  setupBoard(boardX, boardY) {
    for (let i = 0; i < boardX; i++) {
      let tempArr = [];
      for (let i = 0; i < boardY; i++) {
        tempArr.push(" ");
      }
      this.board.push(tempArr);
    }
  }

  getStateInfo(state) {
    var info = super.getStateInfo(state);
    let board = this.board;
    info.extraInfo = {
      board,
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

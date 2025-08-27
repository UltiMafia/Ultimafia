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
    this.currentIndex = 0;
    this.currentPlayer = undefined;
    this.board = [];
    this.randomizedPlayers = [];
    this.randomizedPlayersCopy = [];

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
      for (let i = 0; i < this.board.length; i++) {
        for (let y = 0; y < this.board[i].length; y++) {
          /*
          this.sendAlert(
        ` Row ${i} Col ${y} Value ${this.board[i][y]}`
      );
      */
        }
      }
    }
    super.incrementState();
  }

  placeChip(player, column) {
    let colNum = parseInt(column) - 1;
    for (let i = 0; i < this.boardX; i++) {
      if (this.board[this.boardX - 1 - i][colNum] == " ") {
        this.board[this.boardX - 1 - i][colNum] = player;
        return [this.boardX - 1 - i, colNum];
      }
    }
  }

  CheckForConnections(player, row, col) {
    const rowNew = row;
    const colNew = col;
    if (
      this.checkRecursive(player, rowNew, colNew, 0, "Up") +
        this.checkRecursive(player, rowNew, colNew, 0, "Down") >=
        3 ||
      this.checkRecursive(player, rowNew, colNew, 0, null, "Left") +
        this.checkRecursive(player, rowNew, colNew, 0, null, "Right") >=
        3 ||
      this.checkRecursive(player, rowNew, colNew, 0, "Up", "Left") +
        this.checkRecursive(player, rowNew, colNew, 0, "Down", "Right") >=
        3 ||
      this.checkRecursive(player, rowNew, colNew, 0, "Up", "Right") +
        this.checkRecursive(player, rowNew, colNew, 0, "Down", "Left") >=
        3
    ) {
      return true;
    }
    return false;
  }

  checkRecursive(player, row, col, distance, Direction1, Direction2) {
    if (this.board[row] && this.board[row][col] == player.name) {
      if (distance == 3) {
        /*
        this.sendAlert(
        `${Direction1} ${Direction2} Distance ${distance+1}`
      );
      */
        return distance;
      } else {
        if (Direction1 == "Up") {
          row = row - 1;
        } else if (Direction1 == "Down") {
          row = row + 1;
        }
        if (Direction2 == "Left") {
          col = col - 1;
        } else if (Direction2 == "Right") {
          col = col + 1;
        }
        return this.checkRecursive(
          player,
          row,
          col,
          distance + 1,
          Direction1,
          Direction2
        );
      }
    } else {
      /*
      this.sendAlert(
        `${Direction1} ${Direction2} Distance ${distance-1}`
      );
      */
      return distance - 1;
    }
  }

  isBoardFull() {
    for (let k = 0; k < this.board.length; k++) {
      for (let h = 0; h < this.board[k].length; h++) {
        if (this.board[k][h] == " ") {
          return false;
        }
      }
    }
    return true;
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
      winCheck.check(aliveCount, winners, aliveCount);
    }

    if (winners.groupAmt() > 0) finished = true;
    else if (aliveCount == 0) {
      winners.addGroup("No one");
      finished = true;
    } else if (this.isBoardFull()) {
      winners.addGroup("No one");
      finished = true;
    }

    winners.determinePlayers();
    return [finished, winners];
  }
};

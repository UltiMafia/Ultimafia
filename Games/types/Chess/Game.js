const Game = require("../../core/Game");
const Action = require("./Action");
const Player = require("./Player");
const Queue = require("../../core/Queue");
const Winners = require("../../core/Winners");
const Random = require("../../../lib/Random");
const { Chess } = require("chess.js");

module.exports = class ChessGame extends Game {
  constructor(options) {
    super(options);

    this.type = "Chess";
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
    this.randomizedPlayers = [];
    this.playerColors = {};
    this.currentPlayerColor = "w"; // 'w' or 'b'
    this.fen = "";
    this.moveHistory = [];
    this.gameOverReason = null;
    this.winnerColor = null; // 'w', 'b', or 'draw'
  }

  start() {
    this.randomizedPlayers = Random.randomizeArray(this.players.array());

    // Assign colors (first randomized player is White, second is Black)
    if (this.randomizedPlayers.length >= 2) {
      this.playerColors[this.randomizedPlayers[0].name] = "w";
      this.playerColors[this.randomizedPlayers[1].name] = "b";
    }

    this.currentPlayerColor = "w";
    this.currentIndex = 0; // index of white player in randomizedPlayers

    this.chess = new Chess();
    this.fen = this.chess.fen();
    this.moveHistory = [];
    this.gameOverReason = null;
    this.winnerColor = null;

    super.start();
  }

  incrementCurrentIndex() {
    this.currentPlayerColor = this.currentPlayerColor === "w" ? "b" : "w";
    const activePlayer = this.randomizedPlayers.find(
      (p) => this.playerColors[p.name] === this.currentPlayerColor
    );
    if (activePlayer) {
      this.currentIndex = this.randomizedPlayers.indexOf(activePlayer);
    }
  }

  incrementState() {
    let previousState = this.getStateName();
    if (previousState == "Turn") {
      this.incrementCurrentIndex();
      const activePlayer = this.randomizedPlayers[this.currentIndex];
      if (activePlayer) {
        this.sendAlert(
          `${activePlayer.name}'s Turn (${
            this.currentPlayerColor === "w" ? "White" : "Black"
          })!`
        );
      }
    }
    super.incrementState();
  }

  makeMove(playerName, moveSelection) {
    const playerColor = this.playerColors[playerName];
    if (playerColor !== this.currentPlayerColor) {
      return false;
    }

    try {
      const move = this.chess.move(moveSelection);
      if (!move) {
        return false;
      }

      this.fen = this.chess.fen();
      this.moveHistory.push(move.san);

      if (this.chess.isGameOver()) {
        if (this.chess.isCheckmate()) {
          this.winnerColor = playerColor;
        } else {
          this.winnerColor = "draw";
        }
        this.gameOverReason = this.getGameOverReason();
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  getGameOverReason() {
    if (this.chess.isCheckmate()) return "Checkmate";
    if (this.chess.isStalemate()) return "Stalemate";
    if (this.chess.isInsufficientMaterial()) return "Insufficient Material";
    if (this.chess.isThreefoldRepetition()) return "Threefold Repetition";
    if (this.chess.isDraw()) return "Draw";
    return "Game Over";
  }

  getStateInfo(state) {
    var info = super.getStateInfo(state);
    info.extraInfo = {
      fen: this.fen,
      history: this.moveHistory,
      turn: this.currentPlayerColor,
      playerColors: this.playerColors,
      gameOverReason: this.gameOverReason,
      winnerColor: this.winnerColor,
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
    } else if (this.chess && this.chess.isGameOver()) {
      finished = true;
      if (this.winnerColor && this.winnerColor !== "draw") {
        const winningPlayer = this.randomizedPlayers.find(
          (p) => this.playerColors[p.name] === this.winnerColor
        );
        if (winningPlayer) {
          winners.addPlayer(winningPlayer, winningPlayer.name);
        } else {
          winners.addGroup("No one");
        }
      } else {
        winners.addGroup("No one");
      }
    }

    winners.determinePlayers();
    return [finished, winners];
  }
};

const Game = require("../../core/Game");
const Action = require("./Action");
const Player = require("./Player");
const Queue = require("../../core/Queue");
const Winners = require("../../core/Winners");
const DrawDiscardPile = require("./DrawDiscardPile");
const Random = require("../../../lib/Random");

module.exports = class CrazyEightsGame extends Game {
  constructor(options) {
    super(options);

    this.type = "Crazy Eights";
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

    // game settings
    this.crazyQueens = options.settings.crazyQueens;
    this.crazyAces = options.settings.crazyAces;
    this.crazyTwos = options.settings.crazyTwos;
    this.finalCard = options.settings.finalCard;

    this.allowedSuits = ["♦","♣","♥","♠","♢","♧","♡","♤"];
    this.wildCards = ["8"];

    this.reverse = false;
    this.game.draw2 = false;

    this.numToDraw = 0;

    this.drawDiscardPile = new DrawDiscardPile();
  }

  start() {
    this.initGameDeck();
    this.initPlayerDeck();
    this.initVariants();
    this.initRound();
    super.start();
  }

  initGameDeck() {
    if (this.players.length <= 5) {
      this.allowedSuits = ["♦","♣","♥","♠"];
    }
    this.drawDiscardPile.initStandardDecks(this.allowedSuits.length/4);
  }

  initPlayerDeck() {
    for (let player of this.players) {
      if (this.players.length <= 2) {
        player.hand = this.drawDiscardPile.drawMultiple(7);
      } else {
        player.hand = this.drawDiscardPile.drawMultiple(8);
      }
    }
  }
  
  initVariants() {
    if (this.crazyQueens) {
      this.wildCards.push("Q");
    }
    if (this.crazyAces) {
      this.wildCards.push("A");
    }
    if (this.crazyTwos) {
      this.wildCards.push("2");
    }
    if (this.finalCard) {
      for (let player of this.players) {
        player.holdItem("Announce");
      }
    }
  }

  initRound() {
    let firstPlayer = Random.randArrayVal(this.alivePlayers());
    firstPlayer.holdItem("Move");
  }

  countLowestScore() {
    let lowestScore = 10000;
    for (let player of this.players) {
      if (player.getScore() < lowestScore) {
        lowestScore = player.getScore();
      }
    }
    return lowestScore;
  }

  getPointGoal() {
    return 50*this.players.length;
  }

  getAllScores() {
    let scores = {};
    for (let player of this.players) {
      scores[player.name] = player.score;
    }
    return scores;
  }
  
  getStateInfo(state) {
    var info = super.getStateInfo(state);

    let scores = this.getAllScores();
    info.extraInfo = {
      topCard: this.drawDiscardPile.peekDiscard(),
      scores: scores,
    };
    return info;
  }
  checkWinConditions() {
    var finished = false;
    var counts = {};
    var winQueue = new Queue();
    var winners = new Winners(this);
    winners.queueShortAlert = true;
    var aliveCount = this.alivePlayers().length;

    for (let player of this.players) {
      let alignment = player.role.alignment;

      if (!counts[alignment]) counts[alignment] = 0;

      if (player.alive) counts[alignment]++;

      winQueue.enqueue(player.role.winCheck);
    }

    for (let winCheck of winQueue) {
      winCheck.check(counts, winners, aliveCount);
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
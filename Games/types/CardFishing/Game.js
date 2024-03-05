const Game = require("../../core/Game");
const Action = require("./Action");
const Player = require("./Player");
const Queue = require("../../core/Queue");
const Winners = require("./Winners");
const DrawDiscardPile = require("./DrawDiscardPile");
const Random = require("../../../lib/Random");

module.exports = class CardFishingGame extends Game {
  constructor(options) {
    super(options);

    this.type = "Card Fishing";
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

    this.drawDiscardPile = new DrawDiscardPile();
  }

  start() {
    this.initPlayerHands();
    super.start();
  }

  initPlayerHands() {
    this.drawDiscardPile.initStandardDecks(this.getDecksToGenerate());
    for (let player of this.players) {
      player.hand.push(this.drawDiscardPile.drawMultiple(8));
      player.holdItem("Move");
    }
  }

  getDecksToGenerate() {
    return Math.ceil(this.players.length/3);
  }

  getMatchingCards(cardToMatch) {
    let matchingCards = [];
    let attributes = this.drawDiscardPile.getStandardCardAttributes(cardToMatch);
    let cardValue = attributes[0];
    let cardSuit = attributes[1];
    let suits = this.drawDiscardPile.getStandardSuits(this.getDecksToGenerate());
    for (let suit of suits) {
      if (
        suit === "H" & cardSuit === "D" ||
        suit === "D" & cardSuit === "H" ||
        suit === "S" & cardSuit === "C" ||
        suit === "C" & cardSuit === "S"
      ) {
        matchingCards.push(`${cardValue}•${suit}`);
      }
    }
    return matchingCards;
  }

  checkMatchingCards(cardToCheck) {
    let cards = this.getMatchingCards(cardToCheck);
    for (let card of cards) {
      if (this.drawDiscardPile.checkInDrawPile(card)) {
        return true;
      }
    }
    return false;
  }

  determineHighScore() {
    let highestScore = 0;
    let highestScorers = [];
    for (let player of this.game.players) {
      if (player.score > highestScore) {
        highestScore = player.score;
      }
      if (player.score === highestScore) {
        highestScorers.push(player);
      }
    }
    return highestScorers;
  }

  getStateInfo(state) {
    var info = super.getStateInfo(state);

    let unrenderedPile = this.drawDiscardPile.drawPile;
    let renderedPile = this.drawDiscardPile.renderStandardCards(unrenderedPile);

    let playerPoints = {};
    for (let player of this.players) {
      playerPoints[player.name] = player.points;
    }

    info.extraInfo = {
      cards: unrenderedPile,
      points: playerPoints,
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

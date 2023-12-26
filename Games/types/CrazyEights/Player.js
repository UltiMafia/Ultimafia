const Player = require("../../core/Player");

module.exports = class CrazyEightsPlayer extends Player {
  constructor(user, game, isBot) {
    super(user, game, isBot);

    this.hand = [];
    this.score = 0;
  }

  getAllowedCards() {
    let topCard = this.game.drawDiscardPile.peekDiscard();
    let allowedCards = [];
    if (this.game.draw2) {
      for (let card of this.hand) {
        if (card[1] === "2") {
          allowedCards.push(card);
        }
      }
    }
    for (let card of this.hand) {
      if (card[0] === topCard[0] || card[1] === topCard[1] || card[1] === "8") {
        allowedCards.push(card);
      }
    }
    return allowedCards;
  }

  checkIfCanPlace() {
    let allowedCards = this.getAllowedCards();
    if (this.game.draw2) {
      this.game.numToDraw += 2;
      return false;
    }
    if (allowedCards.length === 0) {
      return false;
    }
    return true;
  }

  removeCardFromHand(c) {
    let index = this.hand.indexOf(c);
    this.hand.splice(index);
  }

  placeCard(c) {
    this.game.drawDiscardPile.discard(c);
    this.game.drawDiscardPile.refill();
    this.removeCardFromHand(c);
  }

  drawCards(n) {
    let cardsDrawn = this.game.drawDiscardPile.drawMultiple(n);
    this.game.drawDiscardPile.refill();
    this.hand.push(...cardsDrawn);
  }

  switchMoves(original, current) {
    this.dropItem(original);
    this.holdItem(current);
  }

  getScore() {
    return this.score;
  }

  addScore(value) {
    if (value === "8") {
      scoreToAdd = 50;
    } else if (value === "J" || value === "Q" || value === "K") {
      scoreToAdd = 10;
    } else if (value === "A") {
      scoreToAdd = 1;
    } else {
      scoreToAdd = parseInt(value);
    }
    this.score += scoreToAdd;
  }

  getOtherScores() {
    let allScores = this.game.getAllScores();
    let otherScores = [];
    for (let [key, value] of Object.entries(allScores)) {
      if (key !== this.name) {
        otherScores.push(value);
      }
    }
    return otherScores;
  }

  getOtherScoresSum() {
    let otherScores = this.getOtherScores();
    return otherScores.reduce((ps, i) => ps + i, 0);
  }
};
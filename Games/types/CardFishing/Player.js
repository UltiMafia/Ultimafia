const Player = require("../../core/Player");

module.exports = class CardFishingPlayer extends Player {
  constructor(user, game, isBot) {
    super(user, game, isBot);

    this.hand = [];
    this.points = 0;
    this.cardPile = this.game.drawDiscardPile.drawPile;
  }

  getCardsMatched() {
    let cardsMatched = [];
    for (let card of this.hand) {
      if (this.game.checkMatchingCards(card)) {
        cardsMatched.push(card);
      }
    }
    return cardsMatched;
  }

  getMatchingCardsMatched() {
    let cardsMatched = this.getCardsMatched();
    let matchingCards = {};
    for (let card of cardsMatched) {
      matchingCards[card] = this.game.getMatchingCards(card);
    }
    return matchingCards;
  }

  checkCardsMatched() {
    if (this.getCardsMatched().length === 0) {
      return false;
    } else {
      return true;
    }
  }

  checkCardsMatch(firstCard,secondCard) {
    let firstAttributes = this.game.drawDiscardPile.getStandardCardAttributes(firstCard);
    let secondAttributes = this.game.drawDiscardPile.getStandardCardAttributes(secondCard);
    let firstSuit = firstAttributes[1];
    let secondSuit = secondAttributes[1];
    if (
      firstSuit === "H" & secondSuit === "D" ||
      firstSuit === "D" & secondSuit === "H" ||
      firstSuit === "S" & secondSuit === "C" ||
      firstSuit === "C" & secondSuit === "S"
    ) {
      return true;
    }
    return false;
  }

  renderCards(cardsToRender) {
    return this.game.drawDiscardPile.renderStandardCards(cardsToRender);
  }

  determineCard(cardToDetermine) {
    return this.game.drawDiscardPile.determineStandardCard(cardToDetermine);
  }

  removeCard(cardRemoved) {
    this.game.drawDiscardPile.discard(cardRemoved);
  }

  gainCard(cardGained) {
    this.game.drawDiscardPile.drawSpecific(cardGained);
  }

  swapCards(cardRemoved,cardGained) {
    this.removeCard(this.determineCard(cardRemoved));
    this.gainCard(this.determineCard(cardGained));
  }

  fishCards(cardBait,cardFished) {
    if (this.checkCardsMatch()) {
      this.removeCard(this.determineCard(cardBait));
      this.removeCard(this.determineCard(cardFished));
      this.calculatePoints(this.determineCard(cardBait),this.determineCard(cardFished));
    } else {
      this.queueAlert(`Your move was invalid. Please try again.`);
    }
  }

  determineScore(cardToDetermine) {
    let attributes = this.game.drawDiscardPile.getStandardCardAttributes(cardToDetermine);
    let values = this.game.drawDiscardPile.getStandardValues();
    let value = attributes[0];
    let suit = attributes[1];
    let valueIndex = values.indexOf(value);
    let valuePoint = valueIndex+1;
    let suitPoint = 0;
    if (suit === "D" || suit === "C") {
      suitPoint = 1;
    } else if (suit === "H" || suit === "S") {
      suitPoint = 2;
    }
    let score = valuePoint*suitPoint;
    return score;
  }

  calculatePoints(firstCard,secondCard) {
    let points = this.determinePoint(firstCard) + this.determinePoint(secondCard);
    this.points += points;
  }
};

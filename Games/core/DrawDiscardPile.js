const Random = require("../../lib/Random");

module.exports = class DrawDiscardPile {
  constructor() {
    this.drawPile = [];
    this.discardPile = [];
    this.destroyedPile = [];
  }

  initCards(cards) {
    this.drawPile = cards;
    this.shuffle();
  }

  initStandardDecks(decks) {
    let standardDeck = [];
    let standardSuits = "♦♣♥♠♢♧♡♤";
    let standardValues = "34567890JQKA2";

    let suitLength = (standardSuits.length)/(3-decks);

    for (let s = 0; s < suitLength; s++) {
      for (let value of standardValues) {
        standardDeck.push(`${standardSuits[s]}${value}`);
      }
    }
    this.initCards(standardDeck);
  }

  shuffle() {
    this.drawPile = Random.randomizeArray(this.drawPile);
  }

  getDrawPileSize() {
    return this.drawPile.length;
  }

  getDiscardPileSize() {
    return this.discardPile.length;
  }

  getTotalPileSize() {
    return this.getDrawPileSize() + this.getDiscardPileSize();
  }

  draw() {
    return this.drawPile.shift();
  }

  drawMultiple(numToDraw) {
    numToDraw = numToDraw || 1;

    var result = [];
    for (let i = 0; i < numToDraw; i++) {
      result.push(this.drawPile.shift());
    }

    return result;
  }

  peekDraw() {
    return this.drawPile[0];
  }

  peekMultipleDraw(numToPeek) {
    numToPeek = numToPeek || 1;

    return this.drawPile.slice(0, numToPeek);
  }
  
  peekDiscard() {
    return this.discardPile[0];
  }

  peekMultipleDrawDiscard(numToPeek) {
    numToPeek = numToPeek || 1;

    return this.discardPile.slice(0, numToPeek);
  }

  discard(card) {
    this.discardPile.push(card);
  }

  discardMultiple(cards) {
    for (let card of cards) {
      this.discardPile.push(card);
    }
  }

  destroy(card) {
    this.destroyedPile.push(card);
  }

  destroyMultiple(cards) {
    for (let card of cards) {
      this.destroyedPile.push(card);
    }
  }

  refillDrawFromDiscard() {
    this.drawPile.push(...this.discardPile);
    this.discardPile = [];
  }

  refillDrawFromDiscardExcludingTop() {
    let topCard = this.peekDiscard();
    let otherCards = this.discardPile.filter((card) => card !== topCard);
    this.drawPile.push(...otherCards);
    this.discardPile = [];
    this.discardPile.push(topCard);
  }
};

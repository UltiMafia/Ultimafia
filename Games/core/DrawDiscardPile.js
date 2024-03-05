const Random = require("../../lib/Random");
const standardDeckData = require("../..//data/standardDeck");

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

  shuffle() {
    this.drawPile = Random.randomizeArray(this.drawPile);
  }

  getStandardSuits(decks) {
    decks = decks || 1;

    let standardSuits = [];
    let standardSuitSymbols = ["D","C","H","S"];
    for (let i = 0; i <= decks; i++) {
      standardSuits.push(...standardSuitSymbols);
    }

    return standardSuits;
  }

  getStandardValues(joker, back) {
    joker = joker || false;
    back = back || false;
    
    let standardValues = ["A","2","3","4","5","6","7","8","9","10","J","K","Q"];
    if (joker) {
      standardValues.push("F");
    }
    if (back) {
      standardValues.push("U");
    }
    return standardValues;
  }

  initStandardDecks(decks, joker, back) {
    decks = decks || 1;
    joker = joker || false;
    back = back || false;

    let standardDecks = [];
    let standardSuits = this.getstandardSuits(decks);
    let standardValues = this.getStandardValues(joker, back);
    let colour = "B";
    for (let suit of standardSuits) {
      if (suit === "D" || suit === "H") {
        colour = "R";
      }
      for (let value of standardValues) {
        if (value !== "F") {
          standardDecks.push(`${value}•${suit}`);
        } else {
          standardDecks.push(`${value}•${colour}`);
        }
      }
    }
    this.initCards(standardDecks);
  }

  getStandardCardAttributes(card) {
    let cardAttributes = card.split("•");
    return cardAttributes;
  }

  renderStandardCard(cardToRender) {
    let attributes = this.getStandardCardAttributes(cardToRender);
    let value = attributes[0];
    let suit = attributes[1];
    let rendered = standardDeckData[value][suit];
    return rendered;
  }

  renderStandardCards(cardsToRender) {
    cardsToRender = cardsToRender || [];
    let cardsRendered = [];
    for (let cardToRender of cardsToRender) {
      cardsRendered.push(this.renderStandardCard(cardToRender));
    }
    return cardsRendered;
  }

  determineStandardCard(cardToDetermine) {
    function getKeyByValue(object, value) {
      return Object.keys(object).find(key => object[key] === value);
    }
    let suit = getKeyByValue(standardDeckData, cardToDetermine);
    let value = getKeyByValue(standardDeckData, suit);
    let determined = `${value}•${suit}`
    return determined;
  }

  determineStandardCards(cardsToDetermine) {
    cardsToDetermine = cardsToDetermine || [];
    let cardsDetermined = [];
    for (let cardToDetermine of cardsToDetermine) {
      cardsDetermined.push(this.determineStandardCard(cardToDetermine));
    }
    return cardsDetermined;
  }
  
  getDrawPileSize() {
    return this.drawPile.length;
  }

  getDiscardPileSize() {
    return this.discardPile.length;
  }

  getDestroyedPileSize() {
    return this.destroyedPile.length;
  }

  getUndestroyedPileSize() {
    return this.getDrawPileSize() + this.getDiscardPileSize();
  }

  getTotalPileSize() {
    return this.getDestroyedPileSize() + this.getUndestroyedPileSize();
  }

  checkInDrawPile(card) {
    return this.drawPile.includes(card);
  }

  checkInDiscardPile(card) {
    return this.discardPile.includes(card);
  }

  checkInDestroyedPile(card) {
    return this.destroyedPile.includes(card);
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

  peekMultipleDiscard(numToPeek) {
    numToPeek = numToPeek || 1;

    return this.discardPile.slice(0, numToPeek);
  }

  peekDestroyed() {
    return this.destroyedPile[0];
  }

  peekMultipleDestroyed(numToPeek) {
    numToPeek = numToPeek || 1;

    return this.destroyedPile.slice(0, numToPeek);
  }

  draw() {
    return this.drawPile.shift();
  }

  drawMultiple(numToDraw) {
    numToDraw = numToDraw || 1;

    let results = [];
    for (let i = 0; i < numToDraw; i++) {
      results.push(this.drawPile.shift());
    }

    return results;
  }

  drawSpecific(card) {
    let result = "";
    let index = this.drawPile.indexOf(card);
    if (index > -1) {
      result = this.drawPile.splice(index, 1);
      this.drawPile.slice(index);
    }
    return result;
  }

  drawMultipleSpecific(cardsToDraw) {
    cardsToDraw = cardsToDraw || [];

    let results = [];
    for (let cardToDraw of cardsToDraw) {
      let index = this.drawPile.indexOf(cardToDraw);
      if (index > -1) {
        results.push(this.drawPile.splice(index, 1));
        this.drawPile.slice(index);
      }
    }

    return results;
  }

  discard(c) {
    this.discardPile.push(c);
  }

  discardMultiple(cardsToDiscard) {
    cardsToDiscard = cardsToDiscard || [];

    this.discardPile.push(...cardsToDiscard);
  }

  destroy(c) {
    this.destroyedPile.push(c);
  }

  destroyMultiple(cardsToDestroy) {
    cardsToDestroy = cardsToDestroy || [];

    this.destroyedPile.push(...cardsToDestroy);
  }

  refillDrawFromDiscard() {
    this.drawPile.push(...this.discardPile);
    this.discardPile = [];
  }

  refillDrawFromDiscardExceptTop() {
    let topCard = this.peekDiscard();
    let cardsToRefill = this.discardPile.filter((card) => card !== topCard);
    this.drawPile.push(...cardsToRefill);
    this.discardPile = [];
    this.discardPile.push(topCard);
  }
};

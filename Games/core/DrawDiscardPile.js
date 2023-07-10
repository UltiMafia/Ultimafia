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

  shuffle() {
    this.drawPile = Random.randomizeArray(this.drawPile);
  }

  getDrawPileSize() {
    return this.drawPile.length;
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

  discard(c) {
    this.discardPile.push(c);
  }

  destroy(c) {
    this.destroyedPile.push(c);
  }

  refillDrawFromDiscard() {
    this.drawPile.push(...this.discardPile);
    this.discardPile = [];
  }
};

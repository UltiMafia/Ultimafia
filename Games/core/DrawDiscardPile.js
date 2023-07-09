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

  draw(refillIfLessThan) {
    refillIfLessThan = refillIfLessThan || 0;
    if (this.drawPile.length == 0) {
      refillDrawFromDiscard();
    }

    return this.drawPile.shift();
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
    this.shuffle();
  }
};

const DrawDiscardPile = require("../../core/DrawDiscardPile");

module.exports = class CrazyEightsDrawDiscardPile extends DrawDiscardPile {
  constructor() {
    super();
  }

  refillDrawFromPlaced() {
    this.refillDrawFromDiscardExcludingTop();
    this.shuffle();
  }

  refill() {
    if (this.getDrawPileSize() === 0) {
      this.refillDrawFromPlaced();
    }
  }
};
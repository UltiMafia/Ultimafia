const DrawDiscardPile = require("../../core/DrawDiscardPile");
const Random = require("../../../lib/Random");
const { Standard_Deck, Test_Deck } = require("./const/Decks");

module.exports = class RatscrewDrawDiscardPile extends DrawDiscardPile {
  constructor() {
    super();
  }
  initCards() {
    let temp = [];
    for (let x = 0; x < Standard_Deck.length; x++) {
      temp.push(`${Standard_Deck[x]}`);
    }

    super.initCards(temp);
  }

  drawMultiple(numToDraw) {
    numToDraw = numToDraw || 1;
    if (this.drawPile.length < numToDraw) {
      this.refillDrawFromDiscard();
      this.shuffle();
    }
    var result = [];
    for (let i = 0; i < numToDraw; i++) {
      result.push(this.drawPile.shift());
    }

    return result;
  }
};

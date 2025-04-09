const DrawDiscardPile = require("../../core/DrawDiscardPile");
const Random = require("../../../lib/Random");
const { Standard_Deck } = require("./const/Decks");

module.exports = class CardGamesDrawDiscardPile extends DrawDiscardPile {
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
};

const DrawDiscardPile = require("../../core/DrawDiscardPile");
const Standard_Deck = require("./const/Decks");

module.exports = class CardGamesDrawDiscardPile extends DrawDiscardPile {
  constructor() {
    super();
  }
  initCards() {
    super.initCards(Standard_Deck);
  }
};

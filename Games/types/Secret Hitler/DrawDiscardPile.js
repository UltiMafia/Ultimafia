const DrawDiscardPile = require("../../core/DrawDiscardPile");

module.exports = class SecretHitlerDrawDiscardPile extends DrawDiscardPile {
  constructor() {
    super();
  }

  initCards() {
    let liberalPile = Array(6).fill('Liberal');
    let fascistPile = Array(11).fill('Fascist');
    liberalPile.push(...fascistPile);
    super.initCards(liberalPile);
  }
  
  draw() {
    super.draw(3);
  }
};

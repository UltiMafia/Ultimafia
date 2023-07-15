const Player = require("../../core/Player");

module.exports = class TiramisuPlayer extends Player {
  constructor(user, game, isBot) {
    super(user, game, isBot);

    this.score = 0;
    this.cards = [];
  }

  addScore(score) {
    this.score += score;
  }

  getScore() {
    return this.score;
  }

  addCard(card) {
    this.cards.push(card);
    //this.queueAlert(`$You have received a ${card} card!`);
  }

  removeCard(card) {
    this.cards = this.cards.filter(i => i !== card);
  }

  // to hide the alert
  setRole(roleName) {
    super.setRole(roleName, undefined, false, true);
  }
};

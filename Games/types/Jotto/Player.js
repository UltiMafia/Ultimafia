const Player = require("../../core/Player");

module.exports = class JottoPlayer extends Player {
  constructor(user, game, isBot) {
    super(user, game, isBot);
  }

  selectWord(word) {
    this.word = word;
  }

  getOwnWord() {
    return this.word;
  }

  assignOpponent(p) {
    this.opponent = p;
  }

  passTurnToOpponent() {
    this.turn = false;
    this.opponent.turn = true;
  }

  getWordToGuess() {
    return this.opponent?.word;
  }

  // to hide the alert
  setRole(roleName) {
    super.setRole(roleName, undefined, false, true);
  }
};

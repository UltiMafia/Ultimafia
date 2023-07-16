const Player = require("../../core/Player");
const { getWordMap } = require("./utils");

module.exports = class JottoPlayer extends Player {
  constructor(user, game, isBot) {
    super(user, game, isBot);
  }

  selectWord(word) {
    this.word = word;
    this.wordMap = getWordMap(word);
  }

  getOwnWord() {
    return this.word;
  }

  assignOpponent(p) {
    if (this.game.players.length > 2 && !this.game.competitiveMode) {
      this.sendAlert(`You are guessing ${p.name}'s word.`);
    }
    this.opponent = p;
    this.opponent.nextPlayer = this;
  }

  passTurnToNextPlayer() {
    this.turn = false;
    this.nextPlayer.turn = true;
  }

  getWordToGuess() {
    return this.opponent?.word;
  }

  getWordMapToGuess() {
    return this.opponent?.wordMap;
  }

  // to hide the alert
  setRole(roleName) {
    super.setRole(roleName, undefined, false, true);
  }
};

const Card = require("../../Card");

module.exports = class GuessWord extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Guess Word": {
        states: ["Guess Word"],
        flags: ["voting"],
        inputType: "text",
        textOptions: {
          minLength: role.game.wordLength,
          maxLength: role.game.wordLength,
          alphaOnly: true,
          toLowerCase: true,
          validEnglishWord: true,
          submit: "Confirm",
        },
        action: {
          run: function () {
            let score = getWordScore(this.actor.getWordToGuess(), this.target);
            this.actor.lastGuess = this.target;
            this.game.queueAlert(`${this.actor.name} guesses ${this.target} and scored ${score} points!`);
            this.game.recordGuess(this.actor, this.target, score);
          },
        },
        shouldMeet: function() {
          return this.player.turn;
        }
      },
    };
  }
};

function getWordScore(expected, actual) {
  let guessedLetters = {};
  for (let letter of actual) {
    guessedLetters[letter] = true
  }

  let score = 0;
  for (let letter of expected) {
    if (guessedLetters[letter]) {
      score += 1;
    }
  }

  return score;
}
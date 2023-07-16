const Card = require("../../Card");
const { getWordScore } = require("../../utils");

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
            let score = getWordScore(this.actor.getWordMapToGuess(), this.target);
            this.actor.lastGuess = this.target;
            this.game.recordGuess(this.actor, this.target, score);
          },
        },
        shouldMeet: function () {
          return this.player.turn;
        },
      },
    };
  }
};

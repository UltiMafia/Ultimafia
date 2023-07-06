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
          submit: "Confirm",
        },
        action: {
          run: function () {
            let score = this.game.getWordScore(this.actor.opponent.selectedWord, this.target);
            this.game.queueAlert(`${this.actor.name} scored ${score} points!`);
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

const Card = require("../../Card");

module.exports = class GuessWordOnLynch extends Card {
  constructor(role) {
    super(role);

    this.immunity.lynch = 1;

    this.listeners = {
      immune(action) {
        if (action.target == this.player) {
          this.dead = true;
        }
      },
    };

    this.meetings = {
      "Guess Word": {
        states: ["Guess Word"],
        flags: ["instant", "voting"],
        inputType: "text",
        textOptions: {
          minLength: 2,
          maxLength: 20,
          alphaOnly: true,
          toLowerCase: true,
          submit: "Confirm",
        },
        action: {
          run() {
            const word = this.target.toLowerCase();
            this.game.recordGuess(this.actor, word);

            this.actor.role.guessedWord = word;
            if (word !== this.game.townWord) {
              this.actor.kill();
            }
          },
        },
        shouldMeet() {
          return this.dead;
        },
      },
    };
  }
};

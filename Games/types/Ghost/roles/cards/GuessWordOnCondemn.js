const Card = require("../../Card");

module.exports = class GuessWordOnCondemn extends Card {
  constructor(role) {
    super(role);

    this.immunity["condemn"] = 1;

    this.listeners = {
      immune: function (action) {
        if (action.target == this.player) {
          this.guessOnNext = true;
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
          run: function () {
            let word = this.target.toLowerCase();
            this.game.queueAlert(`${this.actor.name} guesses ${word}.`);
            this.game.recordGuess(this.actor, word);

            this.actor.role.guessedWord = word;
            if (this.actor.role.alignment == "Ghost") {
              if (word !== this.game.townWord) {
                this.actor.kill();
              }
            } else {
              if (word !== this.game.foolWord) {
                this.actor.kill();
                for (let player of this.game.players) {
                  if (player.role.alignment == "Town") {
                    player.kill();
                  }
                }
              }
            }
            this.actor.role.guessOnNext = false;
          },
        },
        shouldMeet: function () {
          return this.guessOnNext;
        },
      },
    };
  }
};

const Item = require("../Item");
const Action = require("../Action");
const Random = require("../../../../lib/Random");

module.exports = class GhostGuessWord extends Item {
  constructor() {
    super("GhostGuessWord");

   this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.meetings = {
      "Guess Word": {
        states: ["Dusk"],
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

            this.game.guessedWord = word;
            if (word !== this.game.realWord) {
              this.actor.kill();
            }

            this.actor.role.guessOnNext = false;
          },
        },
        shouldMeet: function () {
          for (let action of this.game.actions[0]) {
            if (action.target == this.player && action.hasLabel("condemn")) {
              return true;
            }
          }
          return false;
        },
      },
    };

    this.listeners = {
        state: function (stateInfo) {
        if (stateInfo.name.match(/Night/)) {
          this.drop();
        }
    }
    };

  }

};

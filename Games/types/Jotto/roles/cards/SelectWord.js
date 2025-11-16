const Card = require("../../Card");

module.exports = class SelectWord extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Select Word": {
        actionName: `Select Word (${role.game.wordLength})`,
        states: ["Select Word"],
        flags: ["voting"],
        inputType: "text",
        textOptions: {
          minLength: role.game.wordLength,
          maxLength: role.game.wordLength,
          alphaOnly: true,
          toLowerCase: true,
          uniqueLettersOnly: true,
          validEnglishWord: true,
          submit: "Confirm",
        },
        action: {
          run: function () {
            this.actor.selectWord(this.target);
            this.actor.queueAlert(`Your word is: ${this.target}`);
          },
        },
      },
    };

    if (role.game.forbiddenMode) {
      this.meetings["Forbid Word"] = {
        actionName: `Forbid Word (${role.game.wordLength})`,
        states: ["Select Word"],
        flags: ["voting"],
        inputType: "text",
        textOptions: {
          minLength: role.game.wordLength,
          maxLength: role.game.wordLength,
          alphaOnly: true,
          toLowerCase: true,
          uniqueLettersOnly: true,
          validEnglishWord: true,
          submit: "Confirm",
        },
        action: {
          run: function () {
            this.actor.selectForbiddenWord(this.target);
            this.actor.queueAlert(`Your forbidden word is: ${this.target}`);
          },
        },
      };
    }
  }
};

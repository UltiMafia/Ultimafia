const Card = require("../../Card");

module.exports = class SelectWord extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Select Word": {
        states: ["Select Word"],
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
            this.actor.selectedWord = this.target;
          },
        },
      },
    };
  }
};

const Card = require("../../Card");

module.exports = class PlayChess extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Make Move": {
        actionName: "Make Move",
        states: ["Turn"],
        flags: ["voting"],
        inputType: "text",
        textOptions: {
          minLength: 2,
          maxLength: 10,
          submit: "Move",
        },
        action: {
          item: this,
          run: function () {
            this.game.makeMove(this.actor.name, this.target);
          },
        },
        shouldMeet: function () {
          const playerColor = this.game.playerColors[this.player.name];
          return playerColor === this.game.currentPlayerColor;
        },
      },
    };
  }
};

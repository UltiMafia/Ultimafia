const Card = require("../../Card");

module.exports = class EndTurn extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "End Turn": {
        actionName: "End Turn",
        states: ["Play"],
        flags: ["voting"],
        inputType: "boolean",
        shouldMeet: function () {
          // Only show this meeting if it's the player's turn
          return this.player.id === this.game.currentTurnPlayerId;
        },
        action: {
          item: this,
          run: function () {
            // End the current player's turn
            const result = this.game.endTurn(this.actor.id);
            if (!result.success) {
              this.game.sendAlert(result.message, [this.actor.id]);
            }
          },
        },
      },
    };
  }
};


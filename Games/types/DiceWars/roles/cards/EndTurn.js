const Card = require("../../Card");

module.exports = class EndTurn extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "End Turn": {
        states: ["Play"],
        flags: ["voting", "instant"],
        inputType: "button",
        targets: ["End Turn"],
        shouldMeet: function () {
          return this.player.id === this.game.currentTurnPlayerId;
        },
        action: {
          item: this,
          run: function () {
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

const Card = require("../../Card");

module.exports = class PlayRatscrew extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Play Card": {
        actionName: "Play Card",
        states: ["Play Cards"],
        // noVeg: a slap mid-turn forces a state cycle; we don't want that
        //       to auto-veg the current player for not voting in time.
        flags: ["voting", "mustAct", "noVeg"],
        inputType: "boolean",
        action: {
          item: this,
          run: function () {
            this.game.playCard(this.actor);
          },
        },
        shouldMeet: function () {
          return (
            this.player.alive &&
            this.player.CardsInHand.length > 0 &&
            this.game.nextToPlay &&
            this.player === this.game.nextToPlay
          );
        },
      },
      Slap: {
        actionName: "Slap",
        states: ["Play Cards"],
        // optional: Slap is opt-in; it shouldn't block state-end when the
        // current player just plays a card normally.
        flags: [
          "voting",
          "instant",
          "noVeg",
          "instantButChangeable",
          "repeatable",
          "optional",
        ],
        inputType: "custom",
        targets: ["Slap"],
        action: {
          run: function () {
            this.game.applySlap(this.actor);
          },
        },
        shouldMeet: function () {
          return this.player.alive;
        },
      },
    };
  }
};

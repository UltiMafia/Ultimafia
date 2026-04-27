const Card = require("../../Card");

module.exports = class PlayCheat extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      // Selection-only meeting. The instant Submit meeting reads from this
      // actor's votes here and resolves the play in one shot.
      "Play Card": {
        actionName: "Choose Cards",
        states: ["Play Cards"],
        flags: ["voting", "multi", "noVeg"],
        inputType: "playingCardButtons",
        multiMin: 1,
        multiMax: 4,
        targets: role.player.CardsInHand,
        action: {
          run: function () {},
        },
        shouldMeet: function () {
          return (
            this.player.alive &&
            this.player === this.game.nextToPlay
          );
        },
      },
      Submit: {
        actionName: "Submit",
        states: ["Play Cards"],
        flags: ["voting", "instant", "mustAct", "noVeg"],
        inputType: "boolean",
        action: {
          run: function () {
            const playCardMeeting = this.actor
              .getMeetings()
              .find((m) => m.name === "Play Card");
            const cards = playCardMeeting?.votes?.[this.actor.id] || [];
            if (cards.length === 0) return;
            this.game.playCheatCards(this.actor, cards);
          },
        },
        shouldMeet: function () {
          return (
            this.player.alive &&
            this.player === this.game.nextToPlay
          );
        },
      },
      "Call Lie": {
        actionName: "Call Lie",
        states: ["Play Cards"],
        flags: [
          "voting",
          "instant",
          "noVeg",
          "instantButChangeable",
          "repeatable",
          "optional",
        ],
        inputType: "custom",
        targets: ["Call Lie"],
        action: {
          run: function () {
            this.game.applyCallLie(this.actor);
          },
        },
        shouldMeet: function () {
          return (
            this.player.alive &&
            this.game.lastPlay != null &&
            this.game.lastPlay.player !== this.player
          );
        },
      },
    };
  }
};

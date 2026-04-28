const Card = require("../../Card");

module.exports = class TownCore extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      // Common chat for everyone. Speech is preprocessed by DrawItGame.preprocessMessage:
      // - the drawer's messages are silenced during Pick/Draw,
      // - non-drawer messages that match the current word are converted into guess events,
      // - players who have already guessed have their messages rerouted to SecretChat.
      Village: {
        states: ["*"],
        flags: ["group", "speech"],
        whileDead: true,
        speakDead: true,
      },
      // Hidden chat for players who have already guessed (and the drawer once Reveal begins).
      // Membership is gated by shouldMeet so the meeting silently includes only the right
      // subset of players each state.
      SecretChat: {
        states: ["Draw", "Reveal"],
        flags: ["group", "speech"],
        whileDead: true,
        shouldMeet: function () {
          const game = this.game;
          if (!game) return false;
          if (
            Array.isArray(game.currentGuessers) &&
            game.currentGuessers.includes(this.player)
          ) {
            return true;
          }
          if (
            typeof game.isDrawer === "function" &&
            game.isDrawer(this.player) &&
            game.getStateName() === "Reveal"
          ) {
            return true;
          }
          return false;
        },
      },
      // Drawer-only meeting during Pick. The targets are the two word options
      // refreshed at the start of each Pick state by the listener below.
      "Pick Word": {
        actionName: "Pick Word",
        states: ["Pick"],
        flags: ["voting", "noVeg"],
        inputType: "showAllOptions",
        targets: [],
        action: {
          priority: 0,
          run: function () {
            // target is the chosen word string
            this.game.currentWord = this.target;
          },
        },
        shouldMeet: function () {
          return (
            typeof this.game.isDrawer === "function" &&
            this.game.isDrawer(this.player)
          );
        },
      },
    };

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo || !stateInfo.name) return;
        if (stateInfo.name !== "Pick") return;
        // Populate the meeting's targets with the two word options for the drawer
        if (
          this.game.currentWordOptions &&
          this.game.currentWordOptions.length > 0 &&
          this.meetings["Pick Word"]
        ) {
          this.meetings["Pick Word"].targets = [
            ...this.game.currentWordOptions,
          ];
        }
      },
    };
  }
};

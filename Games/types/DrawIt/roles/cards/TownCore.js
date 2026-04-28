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
      // Hidden chat for players who have already guessed (the round winners).
      // During Draw: only guessers see it — non-guessers can't peek at hints
      // or banter that might spoil the word.
      // During Reveal: everyone joins so the round-losers can see what the
      // winners were saying once the round is over.
      SecretChat: {
        states: ["Draw", "Reveal"],
        flags: ["group", "speech"],
        whileDead: true,
        shouldMeet: function () {
          const game = this.game;
          if (!game) return false;
          // End-of-round: everyone joins to read the winners' chat.
          if (game.getStateName() === "Reveal") return true;
          // During Draw: only the round winners (guessers) are members.
          if (
            Array.isArray(game.currentGuessers) &&
            game.currentGuessers.includes(this.player)
          ) {
            return true;
          }
          return false;
        },
      },
      // Drawer-only meeting during Pick. The targets are the two word options
      // refreshed at the start of each Pick state by the listener below.
      "Pick a prompt to draw": {
        actionName: "Pick a prompt to draw",
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
          this.meetings["Pick a prompt to draw"]
        ) {
          this.meetings["Pick a prompt to draw"].targets = [
            ...this.game.currentWordOptions,
          ];
        }
      },
    };
  }
};

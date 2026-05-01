const Card = require("../../Card");

module.exports = class TownCore extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      // Common chat for everyone. DrawItGame.preprocessMessage hides speech
      // selectively: drawer is silenced during Pick, drawer + guessers form a
      // hidden speech circle during Draw (their messages stay in Village but
      // reach only the circle), and word-matches are converted into guesses
      // before the raw text echoes.
      Village: {
        states: ["*"],
        flags: ["group", "speech"],
        whileDead: true,
        speakDead: true,
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

const Card = require("../../Card");

module.exports = class TownCore extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      // TODO Wave 3 fix-up: precise meeting wiring (inputType, targets shape) may
      // need adjustment when the chat hook + dispatcher integration lands.
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
          this.game.currentWordOptions.length > 0
        ) {
          this.meetings["Pick Word"].targets = [
            ...this.game.currentWordOptions,
          ];
        }
      },
    };
  }
};

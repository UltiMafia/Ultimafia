const Card = require("../../Card");

module.exports = class PlayConnectFour extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Place Chip": {
        actionName: "Place Chip",
        states: ["Turn"],
        flags: ["voting"],
        inputType: "custom",
        targets: ["1", "2", "3", "4", "5", "6", "7", "8"],
        action: {
          item: this,
          run: function () {
            this.game.placeChip(this.actor.name, this.target);
          },
        },
        shouldMeet: function () {
          return (
            this.player.name ==
            this.game.randomizedPlayersCopy[this.game.currentIndex].name
          );
        },
      },
    };
  }
};

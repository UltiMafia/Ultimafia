const Card = require("../../Card");
const {
  IMPORTANT_MEETINGS,
  ROLE_MEETINGS,
} = require("../../const/ImportantMeetings");

module.exports = class PlayConnectFour extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Place Chip": {
        actionName: "Place Chip",
        states: ["Turn"],
        flags: ["voting", "multi"],
        inputType: "custom",
        targets: ["1", "2", "3", "4", "5", "6", "7", "8"],
        action: {
          item: this,
          run: function () {
            this.game.placeChip(this.actor, this.target);
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

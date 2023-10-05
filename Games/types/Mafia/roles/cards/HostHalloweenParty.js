const Card = require("../../Card");
const { PRIORITY_PARTY_MEETING } = require("../../const/Priority");

module.exports = class HostParty extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Host a Halloween Party?": {
        states: ["Day"],
        flags: ["voting"],
        inputType: "boolean",
        shouldMeet: function () {
          return !this.hostedHalloweenParty;
        },
        action: {
          priority: PRIORITY_PARTY_MEETING,
          run: function () {
            if (this.target == "Yes") {
              this.actor.role.hostedHalloweenParty = true;
              for (let player of this.game.players) {
                player.holdItem("Pumpkin");
              }
            }
          },
        },
      },
    };
  }
};

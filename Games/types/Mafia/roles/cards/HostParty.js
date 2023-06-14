const Card = require("../../Card");
const { PRIORITY_PARTY_MEETING } = require("../../const/Priority");

module.exports = class HostParty extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Host a Party?": {
        states: ["Day"],
        flags: ["voting"],
        inputType: "boolean",
        shouldMeet() {
          return !this.data.hostedParty;
        },
        action: {
          priority: PRIORITY_PARTY_MEETING,
          run() {
            if (this.target == "Yes") {
              this.actor.role.data.hostedParty = true;
              for (const player of this.game.players) {
                player.holdItem("Flier");
              }
            }
          },
        },
      },
    };
  }
};

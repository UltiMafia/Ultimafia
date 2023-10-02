const Card = require("../../Card");
const { PRIORITY_PARTY_MEETING } = require("../../const/Priority");

module.exports = class HostParty extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Host a Masquerade Ball?": {
        states: ["Day"],
        flags: ["voting"],
        inputType: "boolean",
        shouldMeet: function () {
          return !this.hostedBall;
        },
        action: {
          priority: PRIORITY_PARTY_MEETING -1,
          run: function () {
            if (this.target == "Yes") {
              this.actor.role.hostedBall = true;
              this.game.queueAlert(":anon: You are all invited to a masquerade ball!");
              for (let player of this.game.players) {
                player.holdItem("Costume");
              }
            }
          },
        },
      },
    };
  }
};

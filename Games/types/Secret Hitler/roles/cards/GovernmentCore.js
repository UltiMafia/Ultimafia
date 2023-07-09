const Card = require("../../Card");

module.exports = class GovernmentCore extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Government: {
        states: ["*"],
        flags: ["group", "speech"],
        priority: 0,
      },
      "Election Vote": {
        states: ["Election"],
        flags: ["group", "voting"],
        inputType: "custom",
        targets: ["Ja!", "Nein!"],
        priority: 0,
        action: {
          run: function() {
            // TODO account for ties
            if (this.target == "Ja!") {
              this.game.approveElection();
            } else {
              this.game.incrementFailElectionTracker();
            }
          }
        }
      }
    };
  }

  seeVote(vote) {
    if (vote.meeting.name == "Election Vote" && vote.voter != this.role.player) {
      vote.cancel = true;
    }
  }
};

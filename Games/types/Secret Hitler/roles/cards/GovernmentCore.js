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
          run: function () {
            // TODO account for ties
          
            // print results
            let electionVoteMeeting = this.game.getMeetingByName("Election Vote");
            for (let member of electionVoteMeeting.members) {
              let vote = electionVoteMeeting.votes[member.id]
              if (vote) {
                this.game.queueAlert(`${member.player.name} voted ${vote}`)
              }
            }

            if (this.target == "Ja!") {
              this.game.approveElection();
            } else {
              this.game.incrementFailElectionTracker();
            }

            // set specialElection to false
            this.game.specialElection = false;
          },
        },
      },
    };
  }

  seeVote(vote) {
    if (
      vote.meeting.name == "Election Vote" &&
      vote.voter != this.role.player
    ) {
      vote.cancel = true;
    }
  }
};

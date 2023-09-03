const Card = require("../../Card");

module.exports = class GovernmentCore extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Government: {
        states: ["*"],
        flags: ["group", "speech"],
        priority: 0,
        whileDead: true,
        speakDead: true,
      },
      "Election Vote": {
        states: ["Election"],
        flags: ["group", "voting"],
        inputType: "customBoolean",
        targets: ["Ja!", "Nein!"],
        displayOptions: {
          customBooleanNegativeReply: "Nein!",
        },
        priority: 0,
        action: {
          run: function () {
            // print results
            let votes = {};
            votes["Ja!"] = [];
            votes["Nein!"] = [];
            let electionVoteMeeting =
              this.game.getMeetingByName("Election Vote");
            for (let member of electionVoteMeeting.members) {
              let vote = electionVoteMeeting.votes[member.id];
              if (vote) {
                votes[vote].push(member.player.name);
              }
            }

            for (const v in votes) {
              if (votes[v].length > 0) {
                this.game.queueAlert(`Voted ${v}: ${votes[v].join(", ")}`);
              }
            }

            if (this.target == "Ja!") {
              this.game.approveElection();
            } else {
              this.game.incrementFailedElectionTracker();
            }
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

const Item = require("../Item");

/*module.exports = class VotingBallot extends Item {
  constructor(target) {
    super("VotingBallot");

    this.lifespan = 1;

    this.meetingName = target.name + "'s Nomination";

    this.meetings[target.name] = {
      meetingName: this.meetingName,
      actionName: this.meetingName,
      states: ["Voting"],
      flags: ["voting", "group"],
      inputType: "boolean",
      item: this,
      action: {
        labels: ["voting"],
        run: function() {
          let thisMeeting = this.game.getMeetingByName(target.name);
          
          let votesYes = 0;
          let votesNo = 0;

          for (let key in thisMeeting.votes) {
            if (thisMeeting.votes[key] == "Yes") votesYes += 1;
            if (thisMeeting.votes[key] == "No") votesNo += 1;
          }

          this.game.votes[target.name] = {
            votesYes: votesYes,
            player: target,
          }
          this.game.queueAlert(`${target.name}'s nomination results in ${votesYes} vote${votesYes == 1 ? "" : "s"} for and ${votesNo} vote${votesYes == 1 ? "" : "s"} against.`);
          
          if (this.target === "Yes") this.game.queueAlert(`${target.name}'s nomination did not pass.`);

        },
      },
      whileDead: true,
      }
    }
  };*/

const Meeting = require("../../core/Meeting");

module.exports = class WackyWordsMeeting extends Meeting {
  constructor(game, name) {
    super(game, name);
  }

  vote(voter, selection) {
    this.game.markVoted(voter);
    super.vote(voter, selection);

    if (this.game.speedUpMeeting && !this.game.speedUpMeeting.finished) {
      this.game.speedUpMeeting.enableVote(voter);
    }
  }

  rejectVote(voter, selection, msg) {
    voter.sendAlert(msg);

    voter.send("unvote", {
      voterId: voter.id,
      meetingId: this.id,
      target: selection,
    });
  }
};

const Meeting = require("../../core/Meeting");

module.exports = class WackyWordsMeeting extends Meeting {
  constructor(game, name) {
    super(game, name);
  }

  vote(voter, selection) {
    if (this.name != "Give Response") {
      this.game.markVoted(voter);
      super.vote(voter, selection);
      return;
    }

    this.game.markVoted(voter);
    super.vote(voter, selection);
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

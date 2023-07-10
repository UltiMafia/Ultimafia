const Meeting = require("../../core/Meeting");

module.exports = class AcrotopiaMeeting extends Meeting {
  constructor(game, name) {
    super(game, name);
  }

  vote(voter, selection) {
    if (this.name != "Give Acronym") {
      super.vote(voter, selection);
      return;
    }

    let acronym = this.game.currentAcronym;
    let words = selection.split(" ");
    if (words.length != acronym.length) {
      this.rejectVote(voter, selection, "Invalid acronym length.");
      return;
    }

    for (let i of acronym) {
      if (words[i].charAt(0).toLowerCase() != acronym.charAt(i).toLowerCase()) {
        this.rejectVote(voter, selection, "Invalid acronym starting letters.");
        return;
      }
    }
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

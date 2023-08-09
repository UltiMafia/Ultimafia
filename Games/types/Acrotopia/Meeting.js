const Meeting = require("../../core/Meeting");

module.exports = class AcrotopiaMeeting extends Meeting {
  constructor(game, name) {
    super(game, name);
  }

  vote(voter, selection) {
    if (this.name != "Give Acronym") {
      this.game.markVoted(voter);
      super.vote(voter, selection);
      return;
    }

    let acronym = this.game.currentAcronym;
    let words = selection.split(" ");
    if (words.length != acronym.length) {
      this.rejectVote(voter, selection, "Invalid acronym length.");
      return;
    }

    for (let i in acronym) {
      if (words[i] == "") {
        this.rejectVote(voter, selection, "Empty word found.");
        return;
      }
      if (words[i].charAt(0).toLowerCase() != acronym.charAt(i).toLowerCase()) {
        this.rejectVote(voter, selection, "Invalid acronym starting letters.");
        return;
      }
    }

    if (this.game.standardiseCapitalisation) {
      for (let i in words) {
        if (this.game.turnOnCaps) {
          words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
        } else {
          words[i] = words[i].charAt(0).toLowerCase() + words[i].slice(1);
        }
      }

      selection = words.join(" ");
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

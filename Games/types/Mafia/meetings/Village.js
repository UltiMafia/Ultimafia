const Meeting = require("../Meeting");

module.exports = class VillageMeeting extends Meeting {
  constructor(game) {
    super(game, "Village");

    this.actionName = "Vote to Condemn";
    this.group = true;
    this.speech = true;
    this.voting = true;
    this.targets = { include: ["alive"], exclude: [] };
  }

  vote(voter, selection) {
    var voted = super.vote(voter, selection);

    if (
      voted &&
      Object.keys(this.votes).length == this.totalVoters - 1 &&
      this.game.timers["main"] &&
      !this.game.timers["secondary"]
    ) {
      this.game.createTimer("secondary", 60000, () => this.game.checkVeg());
    }
  }

  unvote(voter) {
    var unvoted = super.unvote(voter);

    if (unvoted && this.game.timers["secondary"])
      this.game.clearTimer("secondary");
  }

  finish(isVote) {
    super.finish(isVote);
  }
};

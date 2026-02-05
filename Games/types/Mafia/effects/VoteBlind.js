const Effect = require("../Effect");

module.exports = class VoteBlind extends Effect {
  constructor(lifespan) {
    super("VoteBlind");
    this.lifespan = lifespan || Infinity;
    this.isMalicious = true;
  }

  seeVote(vote) {
    if (vote.voter != this.player) vote.cancel = true;
  }

  seeUnvote(info) {
    if (info.voter != this.player) info.cancel = true;
  }
/*
  seeVote(vote) {
    if (vote.voter != this.player) {
      // Hide the target instead of cancelling the vote completely
      // This allows players to see that someone voted, but not who they voted for
      vote.hideTarget = true;
      vote.modified = true;
    }
  }

  seeUnvote(info) {
    if (info.voter != this.player) {
      // Hide the target for unvotes as well
      info.hideTarget = true;
      info.modified = true;
    }
  }
  */
};

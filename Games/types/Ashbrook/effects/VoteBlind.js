const Effect = require("../Effect");

module.exports = class VoteBlind extends Effect {
  constructor(lifespan) {
    super("VoteBlind");
    this.lifespan = lifespan || Infinity;
  }

  seeVote(vote) {
    if (vote.voter != this.player) vote.cancel = true;
  }

  seeUnvote(info) {
    if (info.voter != this.player) info.cancel = true;
  }
};

const Effect = require("../Effect");

module.exports = class Blind extends Effect {
  constructor(lifespan) {
    super("Blind");
    this.lifespan = lifespan || Infinity;
    this.isMalicious = true;
  }

  hear(message) {
    if (!message.isServer) {
      message.anonymous = true;
      message.modified = true;
    }
  }

  hearQuote(quote) {
    quote.anonymous = true;
    quote.modified = true;
  }
/*
  seeVote(vote) {
    if (vote.voter != this.player) vote.cancel = true;
  }
*/
  seeVote(vote) {
    if (vote.voter != this.player){ 
      if(vote.meeting.hasVotedOnce && vote.meeting.hasVotedOnce.includes(vote.voter)){
      vote.cancel = true;
      return;
    }
      vote.target = "*unknown";
      vote.modified = true;
    }
  }

  seeUnvote(info) {
    if (info.voter != this.player) info.cancel = true;
  }

  seeTyping(info) {
    if (info.playerId != this.player.id) info.cancel = true;
  }
};

const Effect = require("../Effect");

module.exports = class Fog extends Effect {
  constructor(lifespan) {
    super("Fog");
    this.lifespan = lifespan || Infinity;
    this.isMalicious = true;
  }

  seeVote(vote) {
    if (vote.voter != this.player && 
      vote.voter != this.player.getNeighbors()[0] && 
      vote.voter != this.player.getNeighbors()[1]){ 
      if(vote.meeting.hasVotedOnce && vote.meeting.hasVotedOnce.includes(vote.voter)){
      vote.cancel = true;
      return;
    }
      vote.target = "*unknown";
      vote.modified = true;
    }
  }

  seeUnvote(info) {
    if (info.voter != this.player && 
      info.voter != this.player.getNeighbors()[0] && 
      info.voter != this.player.getNeighbors()[1]){
      info.cancel = true;
    }
  }

  hear(message) {
    if (
      !message.isServer &&
      message.sender != this.player &&
      message.sender != this.player.getNeighbors()[0] &&
      message.sender != this.player.getNeighbors()[1]
    ) {
      message.fiddled = true;
    }
  }

  seeTyping(info) {
    if (
      info.playerId != this.player.id &&
      info.playerId != this.player.getNeighbors()[0].id &&
      info.playerId != this.player.getNeighbors()[1].id
    )
      info.cancel = true;
  }
};

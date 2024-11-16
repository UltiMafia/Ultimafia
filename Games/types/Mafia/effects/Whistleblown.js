const Effect = require("../Effect");

module.exports = class Whistleblown extends Effect {
  constructor(lifespan) {
    super("Whistleblown");
    this.lifespan = lifespan || Infinity;
  }

  apply(player) {
    super.apply(player);
    if (this.game.RoomOne.length > 0 && this.game.RoomTwo.length > 0) {
      if (this.game.RoomOne.includes(player)) {
        this.cannotVoteEffect = player.giveEffect("CannotVote", 1, "Room 1");
      } else if (this.game.RoomTwo.includes(player)) {
        this.cannotVoteEffect = player.giveEffect("CannotVote", 1, "Room 2");
      } else {
        this.cannotVoteEffect = player.giveEffect("CannotVote", 1);
      }
    } else {
      this.cannotVoteEffect = player.giveEffect("CannotVote", 1);
    }
    this.cannotBeVotedEffect = player.giveEffect("CannotBeVoted", 1);
  }

  remove() {
    this.cannotVoteEffect.remove();
    this.cannotBeVotedEffect.remove();

    super.remove();
  }
};

const Effect = require("../Effect");

module.exports = class Whistleblown extends Effect {
  constructor(lifespan) {
    super("Whistleblown");
    this.lifespan = lifespan || Infinity;
  }

  apply(player) {
    super.apply(player);
    /*
    if (this.game.RoomOne.length > 0 && this.game.RoomTwo.length > 0) {
      for (let item of this.player.items) {
        if (item.name == "Room" && this.game.RoomOne.includes(this.player)) {
          item.meetings["Room 1"].canVote = false;
        }
        if (item.name == "Room" && this.game.RoomTwo.includes(this.player)) {
          item.meetings["Room 2"].canVote = false;
        }
      }
    }
    */

    this.cannotVoteEffect = player.giveEffect("CannotVote", 1);

    this.cannotBeVotedEffect = player.giveEffect("CannotBeVoted", 1);
  }

  remove() {
    this.cannotVoteEffect.remove();
    this.cannotBeVotedEffect.remove();

    super.remove();
    if (this.game.RoomOne.length > 0 && this.game.RoomTwo.length > 0) {
      for (let item of this.player.items) {
        if (item.name == "Room" && this.game.RoomOne.includes(this.player)) {
          item.meetings["Room 1"].canVote = true;
        }
        if (item.name == "Room" && this.game.RoomTwo.includes(this.player)) {
          item.meetings["Room 2"].canVote = true;
        }
      }
    }
  }
};

const Effect = require("../Effect");

module.exports = class CannotVote extends Effect {
  constructor(lifespan) {
    super("CannotVote");
    this.lifespan = lifespan || Infinity;
  }

  apply(player) {
    super.apply(player);

    player.role.meetings["Village"].canVote = false;
  }

  remove() {
    this.player.role.meetings["Village"].canVote = true;

    super.remove();
  }
};

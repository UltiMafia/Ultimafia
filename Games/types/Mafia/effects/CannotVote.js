const Effect = require("../Effect");

module.exports = class CannotVote extends Effect {
  constructor(lifespan, meetingName) {
    super("CannotVote");
    this.lifespan = lifespan ?? Infinity;
    this.meetingName = meetingName || "Village";
  }

  apply(player) {
    super.apply(player);

    player.role.meetings[this.meetingName].canVote = false;
  }

  remove() {
    this.player.role.meetings[this.meetingName].canVote = true;

    super.remove();
  }
};

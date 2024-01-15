const Effect = require("../Effect");

module.exports = class Dueling extends Effect {
  constructor(options) {
    super("Crowned");
    this.lifespan = options?.lifespan || Infinity;
    this.meetingName = options?.meetingName || "Village";
  }

  apply(player) {
    super.apply(player);

    if (player.role.meetings[this.meetingName]) {
      player.role.meetings[this.meetingName].voteWeight = Infinity;
    }
  }

  remove() {
    if (this.player.role.meetings[this.meetingName]) {
      this.player.role.meetings[this.meetingName].voteWeight = 1;
    }

    super.remove();
  }
};

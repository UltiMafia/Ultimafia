const Effect = require("../Effect");

module.exports = class VoteWeightAdditive extends Effect {
  constructor(lifespan, meetingName) {
    super("VoteWeightAdditive");
    this.target = target
    this.lifespan = lifespan || Infinity;
    this.meetingName = meetingName || "Village";
  }

  apply(player) {
    super.apply(player);

    if (player.role.meetings[this.meetingName]) {
      player.role.meetings[this.meetingName].voteWeight = target.role.meetings[this.meetingName].voteWeight + 1;
    }
  }

  remove() {
    if (this.player.role.meetings[this.meetingName]) {
      this.player.role.meetings[this.meetingName].voteWeight = 1;
    }

    super.remove();
  }
};

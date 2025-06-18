const Effect = require("../Effect");

module.exports = class CannotChangeVoteAtDay extends Effect {
  constructor(lifespan, meetingName) {
    super("CannotChangeVoteAtDay");
    this.lifespan = lifespan ?? Infinity;
    this.meetingName = meetingName || "Village";

    this.listeners = {
    meetingsMade: function () {
        this.player.giveEffect("CannotChangeVote", -1, this.meetingName);
      },
    };
  }
};

const Effect = require("../Effect");

module.exports = class CannotChangeVoteAtDay extends Effect {
  constructor(lifespan, meetingName) {
    super("CannotChangeVoteAtDay");
    this.lifespan = lifespan ?? Infinity;
    this.meetingName = meetingName || "Village";
    this.isMalicious = true;

    this.listeners = {
      meetingsMade: function () {
       let effect = this.player.giveEffect("CannotChangeVote", -1, this.meetingName);
       effect.source = this.source;
      },
    };
  }
};

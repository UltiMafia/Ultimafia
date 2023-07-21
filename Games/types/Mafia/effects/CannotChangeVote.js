const Effect = require("../Effect");

module.exports = class CannotChangeVote extends Effect {
  constructor(lifespan, meetingName) {
    super("CannotChangeVote");
    this.lifespan = lifespan ?? Infinity;
    this.meetingName = meetingName || "Village";
  }

  apply(player) {
    super.apply(player);
    const that = this;
    const targetMeeting = this.player
      .getMeetings()
      .find((e) => e.name === that.meetingName);

    if (targetMeeting && targetMeeting.members[this.player.id]) {
      if (!targetMeeting.votes[this.player.id]) {
        targetMeeting.vote(this.player, "*");
      }
      targetMeeting.members[this.player.id].canUpdateVote = false;
      targetMeeting.members[this.player.id].canUnvote = false;
    }
  }

  remove() {
    const that = this;
    const targetMeeting = this.player
      .getMeetings()
      .find((e) => e.name === that.meetingName);
    if (targetMeeting && targetMeeting.members[this.player.id]) {
      targetMeeting.members[this.player.id].canUpdateVote = true;
      targetMeeting.members[this.player.id].canUnvote = true;
    }

    super.remove();
  }
};
const Effect = require("../Effect");

module.exports = class CannotChangeVote extends Effect {
  constructor(lifespan, meetingName) {
    super("CannotChangeVote");
    this.lifespan = lifespan ?? Infinity;
    this.meetingName = meetingName || "Village";

    this.listeners = {
      vote: function (vote) {
        if (vote.voter.id !== this.player.id) {
          return;
        }

        if (vote.meeting.name !== this.meetingName) {
          return;
        }

        this.cannotUpdateVote();
      },
    };
  }

  apply(player) {
    super.apply(player);

    this.targetMeeting = this.player.getMeetingByName(this.meetingName);
    if (!this.targetMeeting) {
      return;
    }

    // cannot unvote
    this.targetMeeting.members[this.player.id].canUnvote = false;

    // has voted, cannot update vote
    if (this.targetMeeting.votes[this.player.id]) {
      this.cannotUpdateVote();
    }
  }

  cannotUpdateVote() {
    this.targetMeeting.members[this.player.id].canUpdateVote = false;
  }
};

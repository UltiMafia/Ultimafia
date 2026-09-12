const Effect = require("../Effect");

module.exports = class CannotChangeVote extends Effect {
  constructor(lifespan, meetingName) {
    super("CannotChangeVote");
    this.lifespan = lifespan ?? Infinity;
    this.meetingName = meetingName || "Village";
    this.isMalicious = true;

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
      meetingsMade: function () {
        if (!this.targetMeeting) {
          this.initMeeting();
        }
      },
    };
  }

  apply(player) {
    super.apply(player);
    this.initMeeting();
  }

  initMeeting() {
    this.targetMeeting = this.player.getMeetingByName(this.meetingName);
    if (!this.targetMeeting || !this.targetMeeting.members[this.player.id]) {
      return;
    }

    // cannot unvote
    this.targetMeeting.members[this.player.id].canUnvote = false;

    // has voted, cannot update vote
    if (this.targetMeeting.votes[this.player.id]) {
      this.cannotUpdateVote();
    } else {
      this.player.sendMeeting(this.targetMeeting);
    }
  }

  cannotUpdateVote() {
    if (!this.targetMeeting) {
      this.targetMeeting = this.player.getMeetingByName(this.meetingName);
    }
    if (this.targetMeeting && this.targetMeeting.members[this.player.id]) {
      this.targetMeeting.members[this.player.id].canUpdateVote = false;
      this.player.sendMeeting(this.targetMeeting);
    }
  }

  remove() {
    if (this.targetMeeting && this.targetMeeting.members[this.player.id]) {
      if (!this.targetMeeting.noUnvote) {
        this.targetMeeting.members[this.player.id].canUnvote = true;
      }
      this.targetMeeting.members[this.player.id].canUpdateVote = true;
      this.player.sendMeeting(this.targetMeeting);
    }
    super.remove();
  }
};

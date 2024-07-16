const Effect = require("../Effect");

module.exports = class Crowned extends Effect {
  constructor(lifespan, meetingName) {
    super("Crowned");
    this.lifespan = lifespan ?? Infinity;
    this.meetingName = meetingName || "Village";
  }

  apply(player) {
    super.apply(player);

    let villageMeeting;
    for (const meeting of player.game.meetings) {
      if (meeting.name === "Village") {
        villageMeeting = meeting;
        break;
      }
    }

    if (villageMeeting) {
      villageMeeting.members[player.id].voteWeight = Infinity;
    }

    /*
    if (player.role.meetings[this.meetingName]) {
      player.role.meetings[this.meetingName].voteWeight = Infinity;
    }
    */
  }

  remove() {
    if (this.player.role.meetings[this.meetingName]) {
      this.player.role.meetings[this.meetingName].voteWeight = 1;
    }

    super.remove();
  }
};

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
    let room1;
    let room2;
    for (const meeting of player.game.meetings) {
      if (meeting.name === "Village") {
        villageMeeting = meeting;
      }
      if(meeting.name = "Room 1"){
        room1 = meeting;
      }
      if(meeting.name = "Room 2"){
        room2 = meeting;
      }
    }

    if (villageMeeting) {
      villageMeeting.members[player.id].voteWeight = Infinity;
    }
    if (room1) {
      room1.members[player.id].voteWeight = Infinity;
    }
    if (room2) {
      room2.members[player.id].voteWeight = Infinity;
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

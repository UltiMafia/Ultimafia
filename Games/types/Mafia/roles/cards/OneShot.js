const Card = require("../../Card");

module.exports = class OneShot extends Card {
  constructor(role) {
    super(role);

    role.metCount = {};
    this.meetingMods = {
      "*": {
        shouldMeet(meetingName) {
          if (meetingName == "Village" || meetingName == "Graveyard")
            return true;

          return (this.metCount[`meets:${meetingName}`] || 0) < 1;
        },
      },
    };
    this.listeners = {
      meeting(meeting) {
        if (!meeting.members[this.player.id]) return;

        if (!this.metCount[`meets:${meeting.name}`])
          this.metCount[`meets:${meeting.name}`] = 1;
        else this.metCount[`meets:${meeting.name}`]++;
      },
    };
  }
};

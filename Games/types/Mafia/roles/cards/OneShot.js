const Card = require("../../Card");
const {
  IMPORTANT_MEETINGS_NIGHT,
  INVITED_MEETINGS,
  STARTS_WITH_MEETINGS,
  IMPORTANT_MEETINGS_DAY,
} = require("../../const/ImportantMeetings");

module.exports = class OneShot extends Card {
  constructor(role) {
    super(role);

    role.metCount = {};
    this.meetingMods = {
      "*": {
        shouldMeet: function (meetingName) {
          // core meetings
          for (let w = 0; w < IMPORTANT_MEETINGS_NIGHT.length; w++) {
            if (meetingName == IMPORTANT_MEETINGS_NIGHT[w] || !meetingName) {
              return true;
            }
          }
          for (let w = 0; w < IMPORTANT_MEETINGS_DAY.length; w++) {
            if (meetingName == IMPORTANT_MEETINGS_DAY[w] || !meetingName) {
              return true;
            }
          }
          if (meetingName == "Graveyard") return true;

          // meetings invited by others
          for (let w = 0; w < INVITED_MEETINGS.length; w++) {
            if (meetingName == INVITED_MEETINGS[w]) {
              return true;
            }
          }

          for (let w = 0; w < STARTS_WITH_MEETINGS.length; w++) {
            if (
              meetingName &&
              meetingName.startsWith(STARTS_WITH_MEETINGS[w])
            ) {
              return true;
            }
          }

          return (this.metCount[`meets:${meetingName}`] || 0) < 1;
        },
      },
    };
    this.listeners = {
      meeting: function (meeting) {
        if (!meeting.members[this.player.id]) return;

        if (!this.metCount[`meets:${meeting.name}`])
          this.metCount[`meets:${meeting.name}`] = 1;
        else this.metCount[`meets:${meeting.name}`]++;
      },
    };
  }
};

const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const {
  IMPORTANT_MEETINGS_NIGHT,
  INVITED_MEETINGS,
  STARTS_WITH_MEETINGS,
  IMPORTANT_MEETINGS_DAY,
} = require("../../const/ImportantMeetings");

module.exports = class ExcessiveRole extends Card {
  constructor(role) {
    super(role);
    this.role.data.wackyModifier = true;

    this.listeners = {
      meetingsMade: function () {
        this.player.getMeetings().forEach((meeting) => {
          if (meeting.name == "Village") {
            return;
          }
          if (IMPORTANT_MEETINGS_NIGHT.includes(meeting.name)) {
            return;
          }
          if (IMPORTANT_MEETINGS_DAY.includes(meeting.name)) {
            return;
          }
          if (INVITED_MEETINGS.includes(meeting.name)) {
            return;
          }
          for (let w = 0; w < STARTS_WITH_MEETINGS.length; w++) {
            if (
              meeting.name &&
              meeting.name.startsWith(STARTS_WITH_MEETINGS[w])
            ) {
              return;
            }
          }
          if (meeting.inputType == "AllRoles") {
            meeting.AllRolesFilters.push("AllOnSite");
            meeting.generateTargets();
            for (let member of meeting.members) {
              member.player.sendMeeting(meeting);
            }
          }
        });
      },
    };
  }
};

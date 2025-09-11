const { MEETING_PRIORITY_DAY } = require("../const/MeetingPriority");
const Item = require("../Item");

module.exports = class DayMeeting extends Item {
  constructor(meetingName, lifespan) {
    super("Day Meeting");

    this.lifespan = lifespan || Infinity;
    this.meetingName = meetingName;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.meetings[meetingName] = {
      meetingName: "Day Meeting",
      // actionName: "End Day Meeting?",
      states: ["Day"],
      // flags: ["group", "speech", "voting"],
      flags: ["group", "speech"],
      inputType: "boolean",
      priority: MEETING_PRIORITY_DAY,
    };
  }
};

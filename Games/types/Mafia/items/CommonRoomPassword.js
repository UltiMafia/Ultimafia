const { MEETING_PRIORITY_MATRON } = require("../const/MeetingPriority");
const Item = require("../Item");

module.exports = class CommonRoomPassword extends Item {
  constructor(meetingName, lifespan) {
    super("Common Room Password");

    this.lifespan = lifespan || Infinity;
    this.meetingName = meetingName;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.meetings[meetingName] = {
      meetingName: "Common Room",
      actionName: "End Common Room Meeting?",
      states: ["Night"],
      flags: ["group", "speech", "voting"],
      inputType: "boolean",
      priority: MEETING_PRIORITY_MATRON,
    };
  }
};

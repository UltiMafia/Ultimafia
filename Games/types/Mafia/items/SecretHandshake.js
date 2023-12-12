const { MEETING_PRIORITY_HANGOUT } = require("../const/MeetingPriority");
const Item = require("../Item");

module.exports = class SecretHandshake extends Item {
  constructor(meetingName, lifespan) {
    super("Secret Handshake");

    this.lifespan = lifespan || Infinity;
    this.meetingName = meetingName;
    this.cannotBeStolen = true;
    this.meetings[meetingName] = {
      meetingName: "Hangout",
      actionName: "End Hangout Meeting?",
      states: ["Night"],
      flags: ["exclusive", "group", "speech", "voting"],
      priority: MEETING_PRIORITY_HANGOUT,
    };
  }
};

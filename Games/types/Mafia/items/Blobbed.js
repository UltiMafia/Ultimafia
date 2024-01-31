const { MEETING_PRIORITY_BLOB } = require("../const/MeetingPriority");
const Item = require("../Item");

module.exports = class Blobbed extends Item {
  constructor(meetingName) {
    super("Blobbed");

    this.meetingName = meetingName;
    this.cannotBeStolen = true;
    this.meetings[meetingName] = {
      meetingName: "Blob",
      actionName: "End Blob Meeting?",
      states: ["Night"],
      speakDead: true,
      flags: ["exclusive", "group", "speech", "anonymous", "voting", "MustAct"],
      priority: MEETING_PRIORITY_BLOB,
      canVote: true,
      displayOptions: {
        disableShowDoesNotVote: true,
      },
      whileDead: true,
    };
  }
};

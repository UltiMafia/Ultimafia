const { MEETING_PRIORITY_SEANCE } = require("../const/MeetingPriority");
const Item = require("../Item");

module.exports = class Blobbed extends Item {
  constructor(meetingName) {
    super("Blobbed");

    this.lifespan = 1;
    this.meetingName = meetingName;
    this.cannotBeStolen = true;
    this.meetings[meetingName] = {
      meetingName: "Absorb",
      actionName: "Absorb?",
      states: ["Night"],
      speakDead: true,
      flags: ["exclusive", "group", "speech", "anonymous", "voting"],
      priority: MEETING_PRIORITY_SEANCE,
      canVote: true,
      displayOptions: {
        disableShowDoesNotVote: true,
      },
      whileDead: true,
    };
  }
};

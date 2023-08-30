const { MEETING_PRIORITY_SEANCE } = require("../const/MeetingPriority");
const Item = require("../Item");

module.exports = class Summon extends Item {
  constructor(meetingName) {
    super("Summon");

    this.lifespan = 1;
    this.meetingName = meetingName;
    this.cannotBeStolen = true;
    this.meetings[meetingName] = {
      meetingName: "Seance",
      actionName: "End Seance Meeting?",
      states: ["Night"],
      speakDead: true,
      flags: ["exclusive", "group", "speech", "anonymous", "voting"],
      priority: MEETING_PRIORITY_SEANCE,
      canVote: false,
      displayOptions: {
        disableShowDoesNotVote: true,
      },
      whileDead: true,
    };
  }
};

const {  MEETING_PRIORITY_FAKE_CULT } = require("../const/MeetingPriority");
const Item = require("../Item");

module.exports = class FakeCultMeeting extends Item {
  constructor(meetingName) {
    super("FakeCultMeeting");

    this.lifespan = 1;
    this.meetingName = "Cult";
    this.cannotBeStolen = true;
    this.meetings["Cult"] = {
      meetingName: "Cult",
      actionName: "End Cult Meeting?",
      states: ["Night"],
      flags: ["exclusive", "group", "speech", "voting", "mustAct", "noVeg"],
      priority: MEETING_PRIORITY_FAKE_CULT,
      inputType: "boolean",
    };
  }
};

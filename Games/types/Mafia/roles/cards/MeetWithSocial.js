const Card = require("../../Card");
const { MEETING_PRIORITY_SOCIAL } = require("../const/MeetingPriority");

module.exports = class MeetWithSocial extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Social Gathering": {
        actionName: "End Social Gathering?",
        states: ["Night"],
        flags: ["exclusive", "group", "speech", "voting", "mustAct", "noVeg"],
        priority: MEETING_PRIORITY_SOCIAL,
        inputType: "boolean",
      },
    };
  }
};

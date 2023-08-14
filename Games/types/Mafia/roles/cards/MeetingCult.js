const Card = require("../../Card");

module.exports = class MeetingCult extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Cult: {
        actionName: "End Meeting?",
        states: ["Night"],
        flags: ["group", "speech", "voting", "mustAct", "noVeg"],
        inputType: "boolean",
      },
    };
  }
};

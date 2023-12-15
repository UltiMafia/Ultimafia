const Card = require("../../Card");

module.exports = class MeetWithSocial extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Social Gathering": {
        actionName: "End Social Gathering?",
        states: ["Night"],
        flags: ["group", "speech", "voting", "mustAct", "noVeg"],
        inputType: "boolean",
      },
    };
  }
};

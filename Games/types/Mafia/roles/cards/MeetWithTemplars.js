const Card = require("../../Card");

module.exports = class MeetWithTemplar extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Templar Meeting": {
        actionName: "End Meeting?",
        states: ["Night"],
        flags: ["group", "speech", "voting", "mustAct", "noVeg"],
        inputType: "boolean",
      },
    };
  }
};

const Card = require("../../Card");

module.exports = class MeetWithTemplars extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Templar Meeting": {
        actionName: "End Templar Meeting?",
        states: ["Night"],
        flags: ["group", "speech", "voting", "mustAct", "noVeg"],
        inputType: "boolean",
      },
    };
  }
};

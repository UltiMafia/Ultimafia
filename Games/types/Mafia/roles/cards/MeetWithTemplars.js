const Card = require("../../Card");

module.exports = class MeetWithTemplar extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Templar Meeting": {
        states: ["Night"],
        flags: ["group", "speech"],
      },
    };
  }
};

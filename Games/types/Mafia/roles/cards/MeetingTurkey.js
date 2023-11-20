const Card = require("../../Card");

module.exports = class MeetingTurkey extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Turkey Meeting": {
        states: ["Night"],
        flags: ["group", "speech"],
      },
    };
  }
};

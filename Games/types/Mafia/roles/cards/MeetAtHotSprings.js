const Card = require("../../Card");

module.exports = class MeetAtHotSprings extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Hot Springs": {
        states: ["Night"],
        flags: ["group", "speech", "anonymous"],
      },
    };
  }
};

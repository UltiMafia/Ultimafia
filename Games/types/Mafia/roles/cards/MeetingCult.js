const Card = require("../../Card");

module.exports = class MeetingCult extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Cult: {
        states: ["Night"],
        flags: ["group", "speech"],
        canVote: false,
      },
    };
  }
};

const Item = require("../Item");

module.exports = class JuryDuty extends Item {
  constructor(reveal) {
    super("JuryDuty");

    this.reveal = reveal;
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.meetings = {
      Court: {
        meetingName: "CourtSession",
        states: ["Court"],
        flags: ["group", "speech", "voting", "anonymous", "MustAct"],
        canVote: true,
        displayOptions: {
          disableShowDoesNotVote: true,
        },
      },
    };
  }
};

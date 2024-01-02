const Item = require("../Item");

module.exports = class JuryDuty extends Item {
  constructor(reveal) {
    super("JuryDuty");

    this.reveal = reveal;
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.meetings = {
      Court: {
        meetingName: "Court Session",
        states: ["Court"],
        flags: ["group", "speech", "voting", "anonymous", "mustAct"],
        targets: { include: ["alive"], exclude: ["dead"] },
        canVote: true,
        displayOptions: { disableShowDoesNotVote: true, },
        action: {
          power: 3,
          labels: ["kill", "condemn", "overthrow"],
          priority: PRIORITY_OVERTHROW_VOTE,
          run: function () {
            if (this.dominates()) {
              this.target.kill("condemn", this.actor);
            }
          },
        },
      },
    };
  }
};

const Item = require("../Item");
const { PRIORITY_SUNSET_DEFAULT } = require("../../const/Priority");

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
        displayOptions: { disableShowDoesNotVote: true },
        action: {
          power: 3,
          labels: ["kill", "condemn"],
          priority: PRIORITY_SUNSET_DEFAULT,
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

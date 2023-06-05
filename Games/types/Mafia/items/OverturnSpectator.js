const Item = require("../Item");

module.exports = class OverturnSpectator extends Item {
  constructor(reveal) {
    super("OverturnSpectator");

    this.reveal = reveal;
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.meetings = {
      "Overturn Vote": {
        meetingName: "Overturn",
        states: ["Overturn"],
        flags: ["group", "speech", "voting"],
        canVote: false,
      },
    };
  }
};

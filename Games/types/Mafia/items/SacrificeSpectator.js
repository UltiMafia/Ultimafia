const Item = require("../Item");

module.exports = class SacrificeSpectator extends Item {
  constructor(reveal) {
    super("Sacrifice Spectator");

    this.reveal = reveal;
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.meetings = {
      "Sacrifice Self": {
        states: ["Overturn"],
        flags: ["group", "speech", "voting"],
        canVote: false,
        displayOptions: {
          disableShowDoesNotVote: true,
        },
      },
    };
  }
};

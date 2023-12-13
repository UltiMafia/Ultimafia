const Item = require("../Item");

module.exports = class Wager extends Item {
  constructor(bookie, lifespan) {
    super("Wager");

    this.lifespan = lifespan || Infinity;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.meetings = {
      "Bookie Wager": {
        states: ["Night"],
        flags: ["group", "speech", "voting"],
        targets: { include: ["alive"], exclude: [] },
        action: {
          run: function () {
            bookie.role.predictedVote = this.target;
          },
        },
      },
    };
  }
};

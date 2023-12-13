const Item = require("../Item");

module.exports = class Wager extends Item {
  constructor(bookie, lifespan) {
    super("Wager");

    this.lifespan = lifespan || Infinity;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.meetings = {
      Wager: {
        actionName: "Predict Vote",
        states: ["Night"],
        flags: ["voting"],
        action: {
          run: function () {
            bookie.role.predictedVote = this.target;
          },
        },
      },
    };
  }
};

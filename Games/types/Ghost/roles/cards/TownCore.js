const Card = require("../../Card");

module.exports = class TownCore extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Village: {
        states: ["Day"],
        flags: ["group", "speech", "voting"],
        targets: { include: ["alive"] },
        whileDead: true,
        passiveDead: true,
        action: {
          labels: ["lynch"],
          run: function () {
            if (this.dominates()) this.target.kill();
          },
        },
      },
    };
  }
};

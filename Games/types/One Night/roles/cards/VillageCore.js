const Card = require("../../Card");

module.exports = class VillageCore extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Village: {
        actionName: "Village Vote",
        states: ["Day"],
        flags: ["group", "speech", "voting"],
        targets: { include: ["alive"], exclude: [] },
        action: {
          labels: ["kill", "lynch", "hidden"],
          priority: 0,
          power: 3,
          run() {
            if (this.dominates()) this.target.kill("lynch", this.actor);
          },
        },
      },
    };
  }
};

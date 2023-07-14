const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class CommitSeppuku extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Convert Player": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["Mafia"] },
        action: {
          labels: ["kill", "seppuku", "convert"],
          priority: PRIORITY_KILL_DEFAULT,
          power: 2,
          run: function () {
            if (this.dominates)
            this.target.setRole("Mafioso");
            if (this.dominates(this.actor))
              this.actor.kill("basic", this.actor);
          },
        },
      },
    };
  }
};

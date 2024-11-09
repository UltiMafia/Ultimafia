const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class StrongKiller extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Strong Kill": {
        actionName: "Kill",
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["kill", "strong"],
          power: 999999,
          priority: PRIORITY_KILL_DEFAULT + 1,
          run: function () {
            if (this.dominates()) this.target.kill("basic", this.actor);
          },
        },
      },
    };
  }
};

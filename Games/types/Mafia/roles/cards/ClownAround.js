const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class ClownAround extends Card {
  constructor(role) {
    super(role);

    this.appearance = {
      self: "Fool",
    };

    this.meetings = {
      "Fool Around": {
        states: ["Night"],
        flags: ["voting", "noVeg"],
        action: {
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT,
          run() {
            if (this.dominates()) this.target.kill("basic", this.actor);
          },
        },
      },
    };
  }
};

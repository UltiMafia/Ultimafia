const Card = require("../../Card");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class WatchPlayer extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Watch (no visit)": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: [] },
        action: {
          labels: ["investigate", "hidden"],
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
          run() {
            const visitors = this.getVisitors(this.target);
            const visitorNames = visitors.map((player) => player.name);
            if (visitorNames.length === 0) {
              visitorNames.push("no one");
            }

            this.actor.queueAlert(
              `:sy0f: ${this.target.name} was visited by ${visitorNames.join(
                ", "
              )} during the night.`
            );
          },
        },
      },
    };
  }
};

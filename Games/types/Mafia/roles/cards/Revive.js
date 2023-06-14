const Card = require("../../Card");
const { PRIORITY_NIGHT_REVIVER } = require("../../const/Priority");

module.exports = class Revive extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Revive: {
        actionName: "Revive",
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["dead"], exclude: ["alive", "self"] },
        shouldMeet() {
          return !this.data.revived;
        },
        action: {
          labels: ["revive"],
          priority: PRIORITY_NIGHT_REVIVER,
          run() {
            if (this.dominates()) this.actor.role.data.revived = true;
            this.target.revive("basic", this.actor);
          },
        },
      },
    };
  }
};

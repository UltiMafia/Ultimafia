const Card = require("../../Card");
const { PRIORITY_NIGHT_REVIVER } = require("../../const/Priority");

module.exports = class Treevive extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Treevive: {
        actionName: "Treevive",
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["dead"], exclude: ["alive", "self"] },
        shouldMeet: function () {
          return !this.data.revived;
        },
        action: {
          labels: ["revive"],
          priority: PRIORITY_NIGHT_REVIVER,
          run: function () {
            if (!this.dominates()) {
              return;
            }

            this.actor.role.data.revived = true;
            this.target.revive("basic", this.actor);
            this.target.setRole("Tree", this.target.role.data, true);
            this.target.queueAlert(":sy2e: You grow into a tree!");
            this.target.role.revealToAll();
          },
        },
      },
    };
  }
};

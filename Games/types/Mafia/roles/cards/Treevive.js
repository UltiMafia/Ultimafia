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
          return !this.revived;
        },
        action: {
          labels: ["revive"],
          priority: PRIORITY_NIGHT_REVIVER - 1,
          run: function () {
            if (!this.dominates()) {
              return;
            }

            this.actor.role.revived = true;
            this.target.revive("basic", this.actor);
            this.target.giveEffect("Tree", this.target.role.data, true);
          },
        },
      },
    };
  }
};

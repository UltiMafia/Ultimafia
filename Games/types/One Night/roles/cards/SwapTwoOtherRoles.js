const Card = require("../../Card");

module.exports = class SwapTwoOtherRoles extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Swap A": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: -1,
          run() {
            this.actor.role.data.targetA = this.target;
          },
        },
      },
      "Swap B": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: 0,
          run() {
            const { targetA } = this.actor.role.data;
            const targetB = this.target;
            const oldARole = `${targetA.role.name}:${targetA.role.modifier}`;

            targetA.setRole(
              `${targetB.role.name}:${targetB.role.modifier}`,
              null,
              true
            );
            targetB.setRole(oldARole, null, true);
          },
        },
      },
    };
  }
};

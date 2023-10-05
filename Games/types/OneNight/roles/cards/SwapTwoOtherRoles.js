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
          run: function () {
            this.actor.role.data.targetA = this.target;
          },
        },
      },
      "Swap B": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: 0,
          run: function () {
            var targetA = this.actor.role.data.targetA;
            var targetB = this.target;
            var oldARole = `${targetA.role.name}:${targetA.role.modifier}`;

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

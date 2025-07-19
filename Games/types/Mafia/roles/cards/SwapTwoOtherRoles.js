const Card = require("../../Card");
const { PRIORITY_SWAP_ROLES } = require("../../const/Priority");

module.exports = class SwapTwoOtherRoles extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Swap A": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          role: this.role,
          priority: PRIORITY_SWAP_ROLES,
          run: function () {
            this.role.data.targetA = this.target;
          },
        },
      },
      "Swap B": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          role: this.role,
          priority: PRIORITY_SWAP_ROLES + 1,
          run: function () {
            if (this.role.data.targetA == null) {
              return;
            }
            var targetA = this.role.data.targetA;
            var targetB = this.target;
            var oldARole = `${targetA.role.name}:${targetA.role.modifier}`;
            let oldFaction = targetA.faction;

            targetA.setRole(
              `${targetB.role.name}:${targetB.role.modifier}`,
              null,
              false,
              false,
              false,
              targetB.faction
            );
            targetB.setRole(oldARole, null, false, false, false, oldFaction);
            this.actor.role.data.targetA = null;
          },
        },
      },
    };
  }
};

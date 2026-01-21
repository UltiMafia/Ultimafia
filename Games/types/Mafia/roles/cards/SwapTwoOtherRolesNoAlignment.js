const Card = require("../../Card");
const { PRIORITY_SWAP_ROLES } = require("../../const/Priority");

module.exports = class SwapTwoOtherRolesNoAlignment extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "First Player": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          role: this.role,
          priority: PRIORITY_SWAP_ROLES,
          labels: ["convert"],
          run: function () {
            this.role.data.targetA = this.target;
          },
        },
      },
      "Second Player": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          role: this.role,
          priority: PRIORITY_SWAP_ROLES + 1,
          labels: ["convert"],
          run: function () {
            if (this.role.data.targetA == null) {
              return;
            }
            if(this.dominates(this.role.data.targetA) && this.dominates(this.target)){
            var targetA = this.role.data.targetA;
            var targetB = this.target;
            var oldARole = `${targetA.getRoleName()}:${targetA.getModifierName()}`;
            let oldFaction = targetA.faction;

            if (
              targetA.faction == "Independent" ||
              targetB.faction == "Independent"
            ) {
              return;
            }

            targetA.setRole(
              `${targetB.getRoleName()}:${targetB.getModifierName()}`,
              null,
              false,
              false,
              false,
              "No Change"
            );
            targetB.setRole(oldARole, null, false, false, false, "No Change");
            this.actor.role.data.targetA = null;
          }
          },
        },
      },
    };
  }
};

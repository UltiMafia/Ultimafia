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
          run: function () {
            if (this.role.data.targetA == null) {
              return;
            }
            var targetA = this.role.data.targetA;
            var targetB = this.target;
            var oldARole = `${targetA.role.name}:${targetA.role.modifier}`;
            let oldFaction = targetA.faction;

            if(targetA.faction == "Independent" || targetB.faction == "Independent"){
            return;
            }

            targetA.setRole(
              `${targetB.role.name}:${targetB.role.modifier}`,
              null,
              false,
              false,
              false,
              "No Change"
            );
            targetB.setRole(oldARole, null, false, false, false, "No Change");
            this.actor.role.data.targetA = null;
          },
        },
      },
    };
  }
};

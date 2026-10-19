const Card = require("../../Card");
const { PRIORITY_SWAP_ROLES } = require("../../const/Priority");
const { attachConversionPhase } = require("../../const/ConversionPhases");

module.exports = class SwapTwoOtherRoles extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Swap A": {
        states: ["Night (Swapping)"],
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
      "Swap B": {
        states: ["Night (Swapping)"],
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

            targetA.setRole(
              `${targetB.getRoleName()}:${targetB.getModifierName()}`,
              null,
              false,
              false,
              false,
              targetB.faction
            );
            targetB.setRole(oldARole, null, false, false, false, oldFaction);
            this.actor.role.data.targetA = null;
          }
          },
        },
      },
    };
    attachConversionPhase(this, "Night (Swapping)");
  }
};

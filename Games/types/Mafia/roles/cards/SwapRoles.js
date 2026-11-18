const Card = require("../../Card");
const { PRIORITY_SWAP_ROLES } = require("../../const/Priority");
const { attachConversionPhase } = require("../../const/ConversionPhases");

module.exports = class SwapRoles extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Swap Roles": {
        states: ["Night (Swapping)"],
        flags: ["voting"],
        action: {
          labels: ["convert"],
          priority: PRIORITY_SWAP_ROLES,
          run: function () {
            if (!this.dominates()) {
              return;
            }

            let currRole = this.actor.role.toRoleData();
            let currRoleData = this.actor.role.data;
            let currFaction = this.actor.faction;

            this.actor.setRole(
              this.target.role.toRoleData(),
              this.target.role.data,
              false,
              false,
              true
            );
            if (
              this.actor.faction != "Independent" &&
              this.target.faction != "Independent"
            ) {
              this.actor.faction = this.target.faction;
            }
            this.target.setRole(
              currRole,
              currRoleData
            );
            if (
              this.actor.faction != "Independent" &&
              this.target.faction != "Independent"
            ) {
              this.target.faction = currFaction;
            }
            this.game.events.emit("roleAssigned", this.actor);
          },
        },
      },
    };
    attachConversionPhase(this, "Night (Swapping)");
  }
};

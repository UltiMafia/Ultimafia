const Card = require("../../Card");
const { PRIORITY_SWAP_ROLES } = require("../../const/Priority");

module.exports = class SwapRoles extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Swap Roles": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["convert"],
          priority: PRIORITY_SWAP_ROLES,
          run: function () {
            if (!this.dominates()) {
              return;
            }

            let currRoleName = this.actor.role.name;
            let currRoleModifier = this.actor.role.modifier;
            let currRoleData = this.actor.role.data;
            let currFaction = this.actor.faction;

            this.actor.setRole(
              `${this.target.getRoleName()}:${this.target.getModifierName()}`,
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
              `${currRoleName}:${currRoleModifier}`,
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
  }
};

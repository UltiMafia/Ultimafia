const Card = require("../../Card");
const { PRIORITY_SWAP_ROLES } = require("../../const/Priority");

module.exports = class SwapRolesOnce extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Swap Roles": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          role: this.role,
          labels: ["convert"],
          priority: PRIORITY_SWAP_ROLES,
          run: function () {
            if (!this.dominates()) {
              return;
            }
            if (!this.dominates(this.actor)) {
              return;
            }

            if (this.role.data.hasSwapped) {
              return;
            }

            this.role.data.hasSwapped = true;
            let currRoleName = this.actor.role.name;
            let currRoleModifier = this.actor.role.modifier;
            let currRoleData = this.actor.role.data;
            let currFaction = this.actor.faction;

            this.actor.setRole(
              `${this.target.getRoleName()}:${this.target.getModifierName()}`,
              this.target.role.data,
              false,
              false,
              true,
              this.target.faction
            );
            this.target.setRole(
              `${currRoleName}:${currRoleModifier}`,
              currRoleData,
              false,
              false,
              true,
              currFaction
            );
            this.game.events.emit("roleAssigned", this.actor);
            this.game.events.emit("roleAssigned", this.target);
          },
        },
      },
    };
  }
};

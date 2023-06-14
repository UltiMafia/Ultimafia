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
          run() {
            if (!this.dominates()) {
              return;
            }

            const currRoleName = this.actor.role.name;
            const currRoleModifier = this.actor.role.modifier;
            const currRoleData = this.actor.role.data;

            this.actor.setRole(
              `${this.target.role.name}:${this.target.role.modifier}`,
              this.target.role.data,
              false,
              false,
              true
            );
            this.target.setRole(
              `${currRoleName}:${currRoleModifier}`,
              currRoleData
            );
            this.game.events.emit("roleAssigned", this.actor);
          },
        },
      },
    };
  }
};

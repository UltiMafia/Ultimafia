const Card = require("../../Card");
const { PRIORITY_MIMIC_ROLE } = require("../../const/Priority");

module.exports = class MimicRole extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Mimic Role": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["convert"],
          priority: PRIORITY_MIMIC_ROLE,
          run: function () {
            let targetRoleAlignment = this.target.getRoleAlignment();
            if (targetRoleAlignment === "Village") {
              // only check conversion immunity for village roles
              if (this.dominates()) {
                this.actor.setRole(
                  `${this.target.getRoleName()}:${this.target.getModifierName()}`,
                  this.target.role.data,
                  false,
                  false,
                  true,
                  "No Change"
                );
                this.target.setRole(
                  "Villager",
                  null,
                  null,
                  null,
                  null,
                  "No Change"
                );
                this.game.events.emit("roleAssigned", this.actor);
              }
            } else if (targetRoleAlignment === "Mafia") {
              this.actor.setRole(
                "Villager",
                null,
                null,
                null,
                null,
                "No Change"
              );
            } else {
              this.actor.setRole("Amnesiac");
            }
          },
        },
      },
    };
  }
};

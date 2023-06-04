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
            let targetRole = this.target.role;
            if (
              targetRole.alignment === "Village" ||
              targetRole.winCount === "Village"
            ) {
              // only check conversion immunity for village roles
              if (this.dominates()) {
                this.actor.setRole(
                  `${targetRole.name}:${targetRole.modifier}`,
                  this.target.role.data,
                  false,
                  false,
                  true
                );
                this.target.setRole("Villager");
                this.game.events.emit("roleAssigned", this.actor);
              }
            } else if (
              targetRole.alignment === "Mafia" ||
              targetRole.winCount === "Mafia"
            ) {
              this.actor.setRole("Villager");
            } else {
              this.actor.setRole("Amnesiac");
            }
          },
        },
      },
    };
  }
};

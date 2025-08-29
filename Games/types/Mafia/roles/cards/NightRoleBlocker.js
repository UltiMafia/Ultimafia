const Card = require("../../Card");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class NightRoleBlocker extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Block: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["block"],
          priority: PRIORITY_NIGHT_ROLE_BLOCKER,
          role: this.role,
          run: function () {
            if (this.dominates()) {
              this.blockActions();
            }

            if (
              this.role.name === "Hooker" &&
              this.target.role.name === "Virgin" &&
              (this.role.canDoSpecialInteractions() ||
                this.target.role.canDoSpecialInteractions())
            ) {
              this.labels = ["convert"];
              if (this.dominates()) {
                this.target.setRole("Villager");
              }
              this.labels = ["block"];
            }

            if (
              this.role.name === "Drunk" &&
              this.target.role.name === "Driver" &&
              (this.role.canDoSpecialInteractions() ||
                this.target.role.canDoSpecialInteractions())
            ) {
              this.labels = ["kill"];
              if (this.dominates()) {
                this.target.kill("basic", this.actor);
              }
              this.labels = ["block"];
            }
          },
        },
      },
    };
  }
};

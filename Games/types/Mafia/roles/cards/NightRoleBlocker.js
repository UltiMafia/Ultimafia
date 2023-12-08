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
          run: function () {
            if (this.dominates()) {
              this.blockActions();
            }

            if (
              this.actor.role.name === "Hooker" &&
              this.target.role.name === "Virgin"
            ) {
              this.target.setRole("Villager");
            }

            if (
              this.actor.role.name === "Drunk" &&
              this.target.role.name === "Driver"
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

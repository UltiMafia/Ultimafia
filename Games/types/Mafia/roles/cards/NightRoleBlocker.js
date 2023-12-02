const Card = require("../../Card");
const Action = require("../../Action");
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
            this.blockActions();

            if (
              this.actor.role.name === "Drunk" &&
              (this.target.role.name === "Driver" ||
                this.target.role.name === "Chauffeur")
            ) {
              let action = new Action({
                actor: this.actor,
                target: this.target,
                game: this.game,
                labels: ["kill"],
                power: 2,
                run: function () {
                  if (this.dominates())
                    this.target.kill("drunkDrive", this.actor);
                },
              });
              action.do();
            }
          },
        },
      },
    };
  }
};

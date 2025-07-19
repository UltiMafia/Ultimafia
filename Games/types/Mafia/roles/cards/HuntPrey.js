const Card = require("../../Card");
const { PRIORITY_KILL_GUESS_ROLE } = require("../../const/Priority");
const Action = require("../../Action");

module.exports = class HuntPrey extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Hunt Prey": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["kill", "consume"],
          priority: PRIORITY_KILL_GUESS_ROLE,
          role: this.role,
          run: function () {
            if (this.role.data.prey) {
              if (this.target.role.name === this.role.data.prey) {
                if (this.dominates()) {
                  this.target.kill("eaten", this.actor);
                  this.actor.role.data.immunity = true;
                  this.actor.queueAlert(
                    "You successfully consume your prey, you are immortal for the day."
                  );
                }
              } else {
                this.actor.role.revealToAll();
              }
              delete this.role.data.prey;
            }
          },
        },
      },
      "Prey's form": {
        states: ["Night"],
        flags: ["voting", "mustAct", "noVeg"],
        inputType: "role",
        targets: { include: ["all"] },
        action: {
          role: this.role,
          priority: PRIORITY_KILL_GUESS_ROLE - 1,
          run: function () {
            this.role.data.prey = this.target;
          },
        },
      },
    };
    this.listeners = {
      state: function (stateInfo) {
        if (this.player.role.data.immunity) {
          this.player.setTempImmunity("kill", 3);
          this.player.setTempImmunity("condemn", 3);
          this.player.setTempImmunity("famine", 3);
          delete this.player.role.data.immunity;
        }
      },
    };
  }
};

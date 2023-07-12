const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");
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
          priority: PRIORITY_KILL_DEFAULT - 1,
          run: function () {
            if (this.actor.role.data.prey) {
              if (this.target.role.name === this.actor.role.data.prey) {
                if (this.dominates()) {
                  this.target.kill("basic", this.actor);
                  this.actor.setTempImmunity("kill", 3);
                  this.actor.setTempImmunity("lynch", 3);
                  this.actor.setTempImmunity("poison", 3);
                  this.actor.setTempImmunity("immortal", 3);
                  this.actor.role.data.immunity = true;
                  this.actor.queueAlert(
                    "You successfully consume your prey, you are immortal for the day."
                  );
                }
              } else {
                this.actor.role.revealToAll();
              }
              delete this.actor.role.data.prey;
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
          priority: PRIORITY_KILL_DEFAULT - 2,
          run: function () {
            this.actor.role.data.prey = this.target;
          },
        },
      },
    };
    this.listeners = {
      state: function (stateInfo) {
        if (this.player.role.data.immunity) {
          this.player.setTempImmunity("kill", 3);
          this.player.setTempImmunity("lynch", 3);
          this.player.setTempImmunity("poison", 3);
          this.player.setTempImmunity("immortal", 3);
          delete this.player.role.data.immunity;
        }
      },
    };
  }
};

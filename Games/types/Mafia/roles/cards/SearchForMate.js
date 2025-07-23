const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class SearchForMate extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Visit: {
        states: ["Night"],
        flags: ["voting", "mustAct"],
        targets: { include: ["alive"], exclude: ["self"] },
        priority: PRIORITY_EFFECT_GIVER_DEFAULT,
        action: {
          role: this.role,
          run: function () {
            if (!this.role.data.mated) {
              this.role.data.mated = 0;
            }
            if (this.target.role == "Panda Bear") {
              this.target.giveEffect("Lovesick", this.actor);
              this.queueGetEffectAlert(
                "Lovesick",
                this.target,
                this.actor.name
              );
              this.actor.giveEffect("Lovesick", this.target);
              this.queueGetEffectAlert(
                "Lovesick",
                this.actor,
                this.target.name
              );
              this.role.data.mated++;
              this.target.role.data.mated++;
              return;
            }
          },
        },
      },
    };
    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.player.queueAlert(
          ":panda: All these wretched humans want from you is your offspring. Wander if you must, but avoid mating no matter what!"
        );
      },
    };
  }
};

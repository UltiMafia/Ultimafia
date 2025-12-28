const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class NightPhantom extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Phantom Kill": {
        actionName: "Phantom Kill",
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            let target = this.target;
            if (this.dominates()) {
              const appearance = target.getAppearance("death");
              target.role.appearance.death = null;
              target.kill("basic", this.actor);
              this.game.queueAlert(
                `${target.name}'s alignment is ${this.game.getRoleAlignment(
                  appearance
                )}.`
              );
              this.actor.setRole(
                `${target.getRoleName()}:${target.getModifierName()}`,
                target.role.data
              );
            }
          },
        },
      },
    };
  }
};

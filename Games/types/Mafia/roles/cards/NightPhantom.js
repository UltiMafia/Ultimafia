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
            target.role.appearance.death = null;
            if (this.dominates()) {
              target.kill("basic", this.actor); 
              target.role.revealAlignmentToAll(false, this.getRevealType("death"));
              this.actor.setRole(
              `${target.role.name}:${target.role.modifier}`,
              target.role.data
            );
            }
          },
        },
      },
    };
  }
};

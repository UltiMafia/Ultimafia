const Card = require("../../Card");
const { PRIORITY_SUPPORT_VISIT_DEFAULT } = require("../../const/Priority");

module.exports = class SearchForMate extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Visit: {
        states: ["Night"],
        flags: ["voting", "mustAct"],
        targets: { include: ["alive"], exclude: ["self"] },
        priority: PRIORITY_SUPPORT_VISIT_DEFAULT,
        action: {
          run: function () {
            if (!this.actor.role.data.mated) {
              this.actor.role.data.mated = 0;
            }
            if (
              this.target.role == "Panda Bear"
            ) {
              this.actor.role.data.mated++;
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
          ":panda: All these wretched humans want from you is your offspring. Wander if you must, but avoid your own kind no matter what!"
        );
      },
    };
  }
};

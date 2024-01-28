const Card = require("../../Card");
const { PRIORITY_SUPPORT_VISIT_DEFAULT } = require("../../const/Priority");

module.exports = class SearchForMate extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Visit: {
        states: ["Night"],
        flags: ["voting", "noVeg"],
        targets: { include: ["alive"], exclude: ["self"] },
        priority: PRIORITY_SUPPORT_VISIT_DEFAULT,
        action: {
          run: function () {},
        },
      },
    };
    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.player.queueAlert(
          "All these wretched humans want from you is your offspring. Wander if you must, but avoid sex no matter what!"
        );
      },
    };
  }
};

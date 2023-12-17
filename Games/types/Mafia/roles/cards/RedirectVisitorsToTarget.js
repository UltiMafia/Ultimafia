const Card = require("../../Card");
const { PRIORITY_REDIRECT_ACTION } = require("../../const/Priority");

module.exports = class RedirectVisitorsToTarget extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Redirect Visitors To": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          priority: PRIORITY_REDIRECT_ACTION,
          run: function () {
            this.redirectAllActionsOnTarget(this.actor, this.target, "absolute");
          },
        },
      },
    };
  }
};

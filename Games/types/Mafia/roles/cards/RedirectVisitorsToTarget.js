const Card = require("../../Card");
const { PRIORITY_MODIFY_ACTION } = require("../../const/Priority");

module.exports = class RedirectVisitorsToTarget extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Redirect Visitors To": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["redirect"],
          priority: PRIORITY_MODIFY_ACTION,
          run: function () {
            if (this.dominates()) {
              for (const action of this.game.actions[0]) {
                if (action.target === this.actor) {
                  action.target = this.target;
                }
              }
            }
          },
        },
      },
    };
  }
};

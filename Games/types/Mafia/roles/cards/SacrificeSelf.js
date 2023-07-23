const Card = require("../../Card");
const { PRIORITY_REDIRECT_ACTION } = require("../../const/Priority");

module.exports = class SacrificeSelf extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Sacrifice Self": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_REDIRECT_ACTION,
          run: function () {
            this.redirectAllActionsOnTarget(this.target, this.actor, "kill");
          },
        },
      },
    };
  }
};

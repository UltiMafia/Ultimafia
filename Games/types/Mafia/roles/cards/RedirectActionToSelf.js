const Card = require("../../Card");
const { PRIORITY_REDIRECT_ACTION } = require("../../const/Priority");

module.exports = class RedirectActionToSelf extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Attract Visitor": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["mafia"] },
        action: {
          priority: PRIORITY_REDIRECT_ACTION,
          run: function () {
            this.redirectAllActions(this.target, this.actor);
          },
        },
      },
    };
  }
};

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
          run() {
            for (const action of this.game.actions[0]) {
              if (
                action.priority > this.priority &&
                !action.hasLabel("uncontrollable") &&
                action.actor == this.target
              ) {
                action.setAllTargets(this.actor);
              }
            }
          },
        },
      },
    };
  }
};

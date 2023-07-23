const Card = require("../../Card");
const { PRIORITY_REDIRECT_ACTION } = require("../../const/Priority");
const Player = require("../../../../core/Player");

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
            for (const action of this.game.actions[0]) {
              if (
                !action.hasLabel("uncontrollable") &&
                action.hasLabel("kill") &&
                !action.hasLabel("absolute") &&
                action.target === this.target
              ) {
                action.target = this.actor;
              }
            }
          },
        },
      },
    };
  }
};

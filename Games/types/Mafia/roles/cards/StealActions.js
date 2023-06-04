const Card = require("../../Card");
const { PRIORITY_STEAL_ACTIONS } = require("../../const/Priority");

module.exports = class StealActions extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Steal Actions": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_STEAL_ACTIONS,
          run: function () {
            for (let action of this.game.actions[0]) {
              if (
                action.priority > this.priority &&
                action.actor == this.target
              ) {
                action.actor = this.actor;
                this.actor.role.stealListeners(this.target);
              }
            }
          },
        },
      },
    };
  }
};

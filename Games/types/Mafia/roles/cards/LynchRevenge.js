const Card = require("../../Card");
const { PRIORITY_SUNSET_DEFAULT } = require("../../const/Priority");

module.exports = class LynchRevenge extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Get Revenge": {
        states: ["Sunset"],
        flags: ["voting"],
        shouldMeet() {
          for (const action of this.game.actions[0])
            if (action.target == this.player && action.hasLabel("lynch"))
              return true;

          return false;
        },
        action: {
          labels: ["kill"],
          priority: PRIORITY_SUNSET_DEFAULT,
          run() {
            if (this.dominates()) this.target.kill("lynchRevenge", this.actor);
          },
        },
      },
    };
    this.stateMods = {
      Day: {
        type: "delayActions",
        delayActions: true,
      },
      Overturn: {
        type: "delayActions",
        delayActions: true,
      },
      Sunset: {
        type: "add",
        index: 5,
        length: 1000 * 30,
        shouldSkip() {
          for (const action of this.game.actions[0])
            if (action.target == this.player && action.hasLabel("lynch"))
              return false;

          return true;
        },
      },
    };
  }
};

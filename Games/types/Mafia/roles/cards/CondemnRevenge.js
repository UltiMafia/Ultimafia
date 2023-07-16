const Card = require("../../Card");
const { PRIORITY_SUNSET_DEFAULT } = require("../../const/Priority");

module.exports = class CondemnRevenge extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Get Revenge": {
        states: ["Sunset"],
        flags: ["voting"],
        shouldMeet: function () {
          let isOverthrow, target;
          for (let action of this.game.actions[0]) {
              if (action.target && action.hasLabels(["lynch", "overthrow"])) {
                  isOverthrow = true;
                  target = action.target
              } else if (!isOverthrow && action.target && action.hasLabel("lynch")) {
                  target = action.target;
              }
          }
          return target === this.player;
        },
        action: {
          labels: ["kill"],
          priority: PRIORITY_SUNSET_DEFAULT,
          run: function () {
            if (this.dominates())
              this.target.kill("condemnRevenge", this.actor);
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
        shouldSkip: function () {
          let isOverthrow, target;
          for (let action of this.game.actions[0]) {
              if (action.target && action.hasLabels(["lynch", "overthrow"])) {
                  isOverthrow = true;
                  target = action.target
              } else if (!isOverthrow && action.target && action.hasLabel("lynch")) {
                  target = action.target;
              }
          }
          return target !== this.player;
        },
      },
    };
  }
};

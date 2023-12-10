const Card = require("../../Card");
const { PRIORITY_SUNSET_DEFAULT } = require("../../const/Priority");

module.exports = class CondemnReveal extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Reveal Role": {
        states: ["Sunset"],
        flags: ["voting"],
        shouldMeet: function () {
          for (let action of this.game.actions[0])
            if (action.target == this.player && action.hasLabel("condemn"))
              return true;

          return false;
        },
        action: {
          labels: ["reveal"],
          priority: PRIORITY_SUNSET_DEFAULT,
          run: function () {
            this.target.role.revealToAll();
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
      Court: {
        type: "delayActions",
        delayActions: true,
      },
      Sunset: {
        type: "add",
        index: 5,
        length: 1000 * 30,
        shouldSkip: function () {
          for (let action of this.game.actions[0])
            if (action.target == this.player && action.hasLabel("condemn"))
              return false;

          return true;
        },
      },
    };
  }
};

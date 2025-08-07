const Card = require("../../Card");
const { PRIORITY_SUNSET_DEFAULT } = require("../../const/Priority");

module.exports = class CondemnRevenge extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Get Revenge": {
        states: ["Dusk"],
        flags: ["voting"],
        shouldMeet: function () {
          if (!this.hasAbility(["Kill"])) {
            return false;
          }
          for (let action of this.game.actions[0]) {
            if (action.target == this.player && action.hasLabel("condemn")) {
              return true;
            }
          }
          return false;
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
      /*
      Dusk:{
        type: "length",
        length: 1000 * 60,
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
        index: 6,
        length: 1000 * 30,
        shouldSkip: function () {
          for (let action of this.game.actions[0])
            if (action.target == this.player && action.hasLabel("condemn"))
              return false;

          return true;
        },
      },
      */
    };
  }
};

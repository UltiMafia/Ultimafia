const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class DouseInGasoline extends Card {
  constructor(role) {
    super(role);

    this.startItems = ["Match"];

    this.meetings = {
      "Douse Player": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["effect", "gasoline"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            this.target.giveEffect("Gasoline");
          },
        },
      },
    };
  }
};

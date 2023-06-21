const Card = require("../../Card");

module.exports = class Prognosticate extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Predict the End": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "custom",
        targets: ["1", "2", "3", "4", "5", "6"],
        action: {
          run: function () {
            this.actor.role.data.prediction = this.target;
          },
        },
        shouldMeet: function () {
          return !this.data.prediction;
        },
      },
    };
  }
};

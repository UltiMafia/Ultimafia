const Card = require("../../Card");
const { PRIORITY_WIN_CON_SET } = require("../../const/Priority");

module.exports = class Prognosticate extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Predict the End": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "custom",
        targets: ["1", "2", "3", "4", "5", "6", "7", "8"],
        action: {
          priority: PRIORITY_WIN_CON_SET - 100,
          role: this.role,
          run: function () {
            this.role.prediction = this.target;
          },
        },
        shouldMeet: function () {
          return !this.prediction;
        },
      },
    };
  }
};

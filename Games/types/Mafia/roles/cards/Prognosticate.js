const Card = require("../../Card");
const { PRIORITY_SUPPORT_VISIT_DEFAULT } = require("../../const/Priority");

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
          priority: PRIORITY_SUPPORT_VISIT_DEFAULT,
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

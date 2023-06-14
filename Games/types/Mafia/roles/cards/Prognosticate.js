const Card = require("../../Card");

module.exports = class Prognosticate extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Predict the End": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "alignment",
        targets: [
          "Night 0",
          "Day 1",
          "Night 1",
          "Day 2",
          "Night 2",
          "Day 3",
          "Night 3",
          "Day 4",
          "Night 4",
          "Day 5",
          "Night 5",
          "Day 6",
          "Night 6",
          "Day 7",
          "Night 7",
          "Day 8",
          "Night 8",
          "Day 9",
          "Night 9",
          "Day 10",
          "Night 10",
          "Day 11",
          "Night 11",
          "Day 12",
          "Night 12",
          "Day 13",
          "Night 13",
          "Day 14",
          "Night 14",
          "Day 15",
          "Night 15",
        ],
        action: {
          run() {
            this.actor.role.data.prediction = this.target;
          },
        },
        shouldMeet() {
          return !this.data.prediction;
        },
      },
    };
  }
};

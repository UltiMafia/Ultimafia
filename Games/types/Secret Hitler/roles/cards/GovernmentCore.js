const Card = require("../../Card");

module.exports = class GovernmentCore extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Government: {
        states: ["*"],
        flags: ["group", "speech"],
        priority: 0
      },
    };
  }
};
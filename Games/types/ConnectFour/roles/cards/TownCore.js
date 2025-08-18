const Card = require("../../Card");

module.exports = class TownCore extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Village: {
        states: ["*"],
        flags: ["group", "speech"],
      },
    };
  }
};

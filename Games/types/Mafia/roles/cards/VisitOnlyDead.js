const Card = require("../../Card");

module.exports = class VisitOnlyDead extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
        "*": {
          states: ["Night"],
          flags: ["voting"],
          targets: { include: ["dead"], exclude: ["alive", "self"] },
        },
      };
  }
};

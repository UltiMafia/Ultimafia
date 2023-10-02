const Card = require("../../Card");

module.exports = class VisitOnlyDead extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
        Village: {
            targets: { include: ["alive, self"], exclude: ["dead"] },
        },
        Cultists: {
            targets: { include: ["alive"], exclude: ["Cult"] },
        },
        Mafia: {
            targets: { include: ["alive"], exclude: ["Mafia"] },
        },
        "*": {
            states: ["Night"],
            flags: ["voting"],
            targets: { include: ["dead"], exclude: ["alive", "self"] },
        },
      };
  }
};

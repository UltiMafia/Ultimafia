const Role = require("../../Card");

module.exports = class CanVisitSelf extends Card {
    constructor(role) {
        super(role);

    this.meetingMods = {
      "*": {
        targets: { include: ["alive"], exclude: [] },
      },
    };
  }
};

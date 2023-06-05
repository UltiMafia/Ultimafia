const Card = require("../../Card");

module.exports = class Solitary extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
      "Templar Meeting": {
        disabled: true,
      },
      "Learn Alignment": {
        flags: ["voting"],
      },
    };
  }
};

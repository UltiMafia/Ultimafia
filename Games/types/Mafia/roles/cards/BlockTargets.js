const Card = require("../../Card");

module.exports = class BlockTargets extends Card {

  constructor(role) {
    super(role);

    this.meetingMods = {
        "*": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["block"],
          priority: PRIORITY_NIGHT_ROLE_BLOCKER,
          run: function () {
            this.blockActions();
          },
        },
        },
    };
  }
};

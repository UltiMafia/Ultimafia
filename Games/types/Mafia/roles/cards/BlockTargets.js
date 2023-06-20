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
            if (this.game.getStateName() != "Night") return;
  
            for (let action of this.game.actions[0]) {
                this.blockActions();
            }
          },
  
        },
      },
    };
  }
};

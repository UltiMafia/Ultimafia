const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GunFramer extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Frame Shooter": {
        actionName: "Frame as Shooter (no visit)",
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["hidden"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT + 1,
          run() {
            this.actor.role.data.shooterMask = this.target.name;
          },
        },
      },
    };
  }
};

const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class ShooterFramer extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Frame Shooter": {
        actionName: "Frame as Shooter",
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["visit"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT + 1,
          run: function () {
            for (let item of this.actor.items) {
              if (item.name === "Gun" || item.name === "Rifle") {
                item.shooterMask = this.target.name;
              }
            }
          },
        },
      },
    };
  }
};

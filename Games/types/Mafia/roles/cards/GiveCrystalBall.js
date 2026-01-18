const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveCrystalBall extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Crystal Ball": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          role: this.role,
          labels: ["giveItem", "crystal"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            
            let item = this.target.holdItem("Crystal Ball");
            this.target.queueGetItemAlert("Crystal Ball");

            item.inheritedModifiers = this.role.modifier.split("/");
          },
        },
      },
    };
  }
};

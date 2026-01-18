const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveFalcon extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Falcon": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          role: this.role,
          labels: ["giveItem", "falcon"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            let item = this.target.holdItem("Falcon");
            this.target.queueGetItemAlert("Falcon");

            item.inheritedModifiers = this.role.modifier.split("/");
          },
        },
      },
    };
  }
};

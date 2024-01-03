const Card = require("../../Card");
const { PRIORITY_Item_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveScepter extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Scepter": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["effect", "scepter"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.giveItem("Scepter");
          },
        },
      },
    };
  }
};

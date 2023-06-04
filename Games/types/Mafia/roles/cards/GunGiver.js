const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GunGiver extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Gun": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "gun"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.holdItem("Gun");
            this.target.queueAlert(":sy2h: You have received a gun!");
          },
        },
      },
    };
  }
};

const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_EARLY } = require("../../const/Priority");

module.exports = class JackGiver extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Jack-In-The-Box": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "jackinthebox"],
          priority: PRIORITY_ITEM_GIVER_EARLY,
          run: function () {
            this.target.holdItem("JackInTheBox");
            this.target.queueGetItemAlert("Jack In The Box");
          },
        },
      },
    };
  }
};

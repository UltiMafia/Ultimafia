const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveDoll extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Doll": {
        states: ["Night"],
        flags: ["voting"],
        shouldMeet: function () {
          return !this.data.dollGiven;
        },
        action: {
          labels: ["giveItem", "doll"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.holdItem("Doll");
            this.target.queueGetItemAlert("Doll");
            this.actor.role.data.dollGiven = true;
          },
        },
      },
    };
  }
};

const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GiveEnvelope extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Envelope": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "message"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.holdItem("Envelope");
            this.target.queueGetItemAlert("Envelope");
          },
        },
      },
    };
  }
};

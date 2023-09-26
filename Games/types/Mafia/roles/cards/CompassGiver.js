const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");
const { MEETING_PRIORITY_TEMPLARS } = require("../../const/MeetingPriority");

module.exports = class CompassGiver extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Compass": {
        states: ["Night"],
        flags: ["voting"],
        priority: MEETING_PRIORITY_TEMPLARS + 1,
        action: {
          labels: ["giveItem", "compass"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            this.target.holdItem("compass");
            this.target.queueAlert(":yuzu: You have received a compass!");
          },
        },
      },
    };
  }
};

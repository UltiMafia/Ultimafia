const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");
const { MEETING_PRIORITY_HOT_SPRINGS } = require("../../const/MeetingPriority");

module.exports = class OrangeGiver extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Hot Springs": {
        states: ["Night"],
        flags: ["exclusive", "group", "speech", "anonymous"],
        priority: MEETING_PRIORITY_HOT_SPRINGS,
      },

      "Give Orange": {
        states: ["Night"],
        flags: ["voting"],
        priority: MEETING_PRIORITY_HOT_SPRINGS + 1,
        action: {
          labels: ["giveItem", "orange"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run() {
            this.target.holdItem("Orange");
            this.target.queueAlert(":sy8e: You have received a yuzu orange!");
          },
        },
      },
    };
  }
};

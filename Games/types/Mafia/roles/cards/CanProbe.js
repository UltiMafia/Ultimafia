const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class CanProbe extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Probe: {
        actionName: "Probe",
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["giveItem", "probe"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run() {
            this.target.holdItem("Probe");
          },
        },
      },
    };
  }
};

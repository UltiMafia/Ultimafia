const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class CanProbe extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Probe: {
        actionName: "Probe",
        states: ["Night"],
        flags: ["group", "speech", "voting"],
        action: {
          labels: ["effect", "probe"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            this.target.giveEffect("Probe");
          },
        },
      },
    };
  }
};

const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class CheckIfVisitIsSuccessful extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Check with Visit": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["investigate"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            this.actor.queueAlert(`Your visit to ${this.target.name} was successful.`);
          },
        },
      },
    };
  }
};

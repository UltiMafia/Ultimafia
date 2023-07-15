const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class TrackPlayerBoolean extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Track (Boolean)": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            let visited = this.hasVisits(this.target);
            if (visited) {
              this.actor.queueAlert(`:sy0g: ${this.target.name} visited somebody`);
            } else {
              this.actor.queueAlert(`:sy0g: ${this.target.name} did not visit anybody`);
            }
          },
        },
      },
    };
  }
};

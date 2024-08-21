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
          labels: ["investigate"],
          run: function () {
            let visited = this.hasVisits(this.target);
            if (this.actor.hasEffect("FalseMode")) {
              if (!visited) {
                this.actor.queueAlert(
                  `:track: ${this.target.name} visited somebody`
                );
              } else {
                this.actor.queueAlert(
                  `:track: ${this.target.name} did not visit anybody`
                );
              }
            } else {
              if (visited) {
                this.actor.queueAlert(
                  `:track: ${this.target.name} visited somebody`
                );
              } else {
                this.actor.queueAlert(
                  `:track: ${this.target.name} did not visit anybody`
                );
              }
            }
          },
        },
      },
    };
  }
};

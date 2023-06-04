const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class TrackPlayer extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Track: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            let visits = this.getVisits(this.target);

            if (visits.length == 0) visits.push("no one");

            this.actor.queueAlert(
              `:sy0g: ${this.target.name} visited ${visits.join(
                ", "
              )} during the night.`
            );
          },
        },
      },
    };
  }
};

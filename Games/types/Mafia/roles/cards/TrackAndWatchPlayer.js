const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class TrackAndWatchPlayer extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Shadow: {
        actionName: "Track and Watch",
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            let visits = this.getVisits(this.target);
            let visitNames = visits.map((p) => p.name);
            let visitors = this.getVisitors(this.target);
            let visitorNames = visitors.map((p) => p.name);
  
            if (visitNames.length == 0) visitNames.push("no one");
            if (visitorNames.length === 0) visitorNames.push("no one");
  
            this.actor.queueAlert(
              `:look: ${this.target.name} was visited by ${visitorNames.join(
                ", "
              )} during the night.`
            );
  
            this.actor.queueAlert(
              `:look: ${this.target.name} visited ${visitNames.join(
                ", "
              )} during the night.`
            );
          },
        },
      },
    };
  }
};

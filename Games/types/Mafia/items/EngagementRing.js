const Item = require("../Item");
const { PRIORITY_DAY_DEFAULT } = require("../const/Priority");

module.exports = class EngagementRing extends Item {
  constructor() {
    super("Engagement Ring");

    this.meetings = {
        Propose: {
          states: ["Day"],
          flags: ["voting", "instant"],
          shouldMeet: function () {
            return !this.isMarried;
          },
          action: {
            labels: ["marriage"],
            run: function () {
              this.game.queueAlert(`Someone proposes to ${this.target.name}.`);
  
              let ring = this.target.holdItem("WeddingRing", this.actor);
              this.game.instantMeeting(ring.meetings, [this.target]);
            },
          },
        },
      };
  }
};

const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class CompareBooleanTrack extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Learn How Many Visited": {
        actionName: "Learn How Many Visited (2)",
        states: ["Night"],
        flags: ["voting", "multi"],
        targets: { include: ["alive"], exclude: ["", "self"] },
        multiMin: 2,
        multiMax: 2,
        action: {
          labels: ["investigate", "alerts"],
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT + 1,
          run: function () {
            var targetA = this.target[0];
            var targetB = this.target[1];

            if (!targetA || !targetB) return;
            let visitedA = this.hasVisits(targetA);
            let reportsA = this.getReports(targetA);
            let visitedB = this.hasVisits(targetB);
            let reportsB = this.getReports(targetB);
            let visitCount = 0;

            if (visitedA || reportsA.length > 0) {
              visitCount = visitCount + 1;
            }
            if (visitedB || reportsB.length > 0) {
              visitCount = visitCount + 1;
            }

            if (this.actor.hasEffect("FalseMode")) {
              if (visitCount == 1) {
                if (Random.randInt(0, 1) == 0) {
                  visitCount = 2;
                } else {
                  visitCount = 0;
                }
              } else {
                visitCount = 2 - visitCount;
              }
            }

            var alert = `:track: You learn that ${visitCount} of your selected players visited somebody or Receviced a Report during the night!`;
            this.actor.queueAlert(alert);
          },
        },
      },
    };
  }
};

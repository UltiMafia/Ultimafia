const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class CompareBooleanTrack extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Learn How Many Visited/Or Got reports": {
        actionName: "Learn How Many Visited/Or Got reports (2)",
        states: ["Night"],
        flags: ["voting", "multi"],
        targets: { include: ["alive"], exclude: ["", "self"] },
        multiMin: 2,
        multiMax: 2,
        action: {
          labels: ["investigate", "alerts"],
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
          run: function () {
            let info = this.game.createInformation(
              "VisitsAndReportsInfo",
              this.actor,
              this.game,
              this.target[0],
              this.target[1]
            );

            info.processInfo();
            this.actor.queueAlert(`:track: ${info.getInfoFormated()}`);
          },
        },
      },
    };
  }
};

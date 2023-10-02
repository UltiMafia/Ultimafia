const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class AlignmentLearnerNaive extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Investigate Naive": {
        actionName: "Investigate",
        states: ["Night"],
        flags: ["group", "voting"],
        action: {
          labels: ["investigate", "alignment"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            var alert = `:invest: You learn that ${this.target.name} is innocent.`;
            this.game.queueAlert(alert, 0, this.meeting.getPlayers());
          },
        },
      },
    };
  }
};

const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class AlignmentLearnerReversed extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Learn Reversed Alignment": {
        actionName: "Learn Alignment",
        states: ["Night"],
        flags: ["group", "voting"],
        action: {
          labels: ["investigate", "alignment"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            var role = this.target.getAppearance("investigate", true);
            var alignment = this.game.getRoleAlignment(role);

            if (alignment == "Village")
              alignment = "not sided with the Village";
            else alignment = "sided with the Village";

            var alert = `:invest: You learn that ${this.target.name} is ${alignment}.`;
            this.game.queueAlert(alert, 0, this.meeting.getPlayers());
          },
        },
      },
    };
  }
};

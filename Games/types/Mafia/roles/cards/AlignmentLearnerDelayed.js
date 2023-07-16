const Card = require("../../Card");
const { PRIORITY_ALIGNMENT_LEARNER } = require("../../const/Priority");

module.exports = class AlignmentLearnerDelayed extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Learn Alignment Delayed": {
        actionName: "Learn Alignment",
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["investigate", "alignment"],
          delay: 1,
          priority: PRIORITY_ALIGNMENT_LEARNER,
          run: function () {
            var role = this.target.getAppearance("investigate", true);
            var alignment = this.game.getRoleAlignment(role);

            if (alignment == "Independent")
              alignment = "neither the Village, Mafia, nor Monsters";
            else alignment = `the ${alignment}`;

            var alert = `:sy0d: You learn that ${this.target.name} is sided with ${alignment}.`;
            this.game.queueAlert(alert, 0, this.meeting.getPlayers());
          },
        },
      },
    };
  }
};

const Card = require("../../Card");
const { PRIORITY_ALIGNMENT_LEARNER } = require("../../const/Priority");
const Random = require("../../../../../lib/Random");

module.exports = class AlignmentLearnerRandom extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Learn Random Alignment": {
        actionName: "Learn Alignment",
        states: ["Night"],
        flags: ["group", "voting"],
        action: {
          labels: ["investigate", "alignment"],
          priority: PRIORITY_ALIGNMENT_LEARNER,
          run: function () {
            let alignment = Random.randArrayVal(this.game.getAllAlignments());

            if (alignment === "Independent")
              alignment = "nobody but themselves";
            else alignment = `the ${alignment}`;

            const alert = `:sy0d: You learn that ${this.target.name} is sided with ${alignment}.`;
            this.game.queueAlert(alert, 0, this.meeting.getPlayers());
          },
        },
      },
    };
  }
};

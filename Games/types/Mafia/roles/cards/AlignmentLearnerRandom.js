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

            if (alignment == "Village")
              alignment = "sided with the Village";
            else alignment = `not sided with the Village`;

            const alert = `:invest: You learn that ${this.target.name} is ${alignment}.`;
            this.game.queueAlert(alert, 0, this.meeting.getPlayers());
          },
        },
      },
    };
  }
};

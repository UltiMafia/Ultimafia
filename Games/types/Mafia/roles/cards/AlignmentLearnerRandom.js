const Card = require("../../Card");
const { PRIORITY_ALIGNMENT_LEARNER } = require("../../const/Priority");
const Random = require("../../../../../lib/Random");

module.exports = class AlignmentLearnerRandom extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Investigate Random": {
        actionName: "Investigate",
        states: ["Night"],
        flags: ["group", "voting"],
        action: {
          labels: ["investigate", "alignment"],
          priority: PRIORITY_ALIGNMENT_LEARNER,
          run: function () {
            let alignment = Random.randArrayVal(this.game.getAllAlignments());

            if (alignment == "Village" || alignment == "Independent") alignment = "innocent";
            else alignment = `guilty`;

            var alert = `:invest: After investigating, you learn that ${this.target.name} is ${alignment}!`;
            this.game.queueAlert(alert, 0, this.meeting.getPlayers());
          },
        },
      },
    };
  }
};

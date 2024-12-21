const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class CompareAlignments extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Compare Alignments": {
        actionName: "Compare Alignments (2)",
        states: ["Night"],
        flags: ["voting", "multi"],
        targets: { include: ["alive"], exclude: ["", "self"] },
        multiMin: 2,
        multiMax: 2,
        action: {
          labels: ["investigate", "alignment"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            var targetA = this.target[0];
            var targetB = this.target[1];

            let info = this.game.createInformation(
              "CompareAlignmentInfo",
              this.actor,
              this.game,
              targetA,
              targetB
            );
            info.processInfo();
            var alert = `:law: ${info.getInfoFormated()}.`;
            this.actor.queueAlert(alert);

           
          },
        },
      },
    };
  }
};

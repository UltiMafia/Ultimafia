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
          run() {
            const targetA = this.target[0];
            const targetB = this.target[1];

            if (!targetA || !targetB) return;

            const roleA = targetA.getAppearance("investigate", true);
            const alignmentA = this.game.getRoleAlignment(roleA);

            const roleB = targetB.getAppearance("investigate", true);
            const alignmentB = this.game.getRoleAlignment(roleB);

            let comparison;

            if (alignmentA == alignmentB) comparison = "the same alignment";
            else comparison = "different alignments";

            const alert = `:sy8h: You learn that ${targetA.name} and ${targetB.name} have ${comparison}!`;
            this.actor.queueAlert(alert);
          },
        },
      },
    };
  }
};

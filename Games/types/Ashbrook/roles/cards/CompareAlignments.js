const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class CompareAlignments extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Compare Alignments": {
        actionName: "Compare Alignments (2)",
        states: ["Night"],
        flags: ["voting", "multi"],
        shouldMeet: function () {
          return !this.data.compared;
        },
        targets: { include: ["alive"], exclude: ["", "self"] },
        multiMin: 2,
        multiMax: 2,
        action: {
          labels: ["investigate", "alignment"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            this.actor.role.data.compared = true;

            var targetA = this.target[0];
            var targetB = this.target[1];

            if (!targetA || !targetB) return;

            var roleA = targetA.getAppearance("investigate", true);
            var alignmentA = this.game.getRoleAlignment(roleA);

            var roleB = targetB.getAppearance("investigate", true);
            var alignmentB = this.game.getRoleAlignment(roleB);

            if (alignmentA == "Villager" || alignmentA == "Outcast"){
              var sideA = "Good";
            } else {
              var sideA = "Evil";
            }

            if (alignmentB == "Villager" || alignmentB == "Outcast"){
              var sideB = "Good";
            } else {
              var sideB = "Evil";
            }


            var comparison;

            if (this.isInsane()){
              comparison = Random.randArrayVal["the same alignment", "different alignments"];
            } else {
              if (sideA == sideB) comparison = "the same alignment";
              else comparison = "different alignments";
            }

            var alert = `:sy8h: You learn that ${targetA.name} and ${targetB.name} have ${comparison}!`;
            this.actor.queueAlert(alert);
          },
        },
      },
    };
  }
};

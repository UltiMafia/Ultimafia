const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class LeaderInvestigate extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Leader Check": {
        actionName: "Leader Check (2)",
        states: ["Night"],
        flags: ["voting", "multi"],
        targets: { include: ["alive", "dead"] },
        multiMin: 2,
        multiMax: 2,
        action: {
          labels: ["investigate", "alignment"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            var targetA = this.target[0];
            var targetB = this.target[1];

            if (!targetA || !targetB) return;

            var roleA = targetA.getAppearance("investigate", true);
            var alignmentA = this.game.getRoleAlignment(roleA);

            var roleB = targetB.getAppearance("investigate", true);
            var alignmentB = this.game.getRoleAlignment(roleB);

            let result;

            if (this.isInsane()){
              result = Random.randArrayVal["have a Leader among them", "do not have a Leader among them"];
            } else {
              if (alignmentA == "Leader" || 
              alignmentB == "Leader" || 
              targetA == this.actor.role.data.chosenGood ||
              targetB == this.actor.role.data.chosenGood){
                result = "have a Leader among them";
              } else {
                result = "do not have a Leader among them";
              }
            }

            var alert = `:sy8h: You learn that ${targetA.name} and ${targetB.name} ${result}!`;
            this.actor.queueAlert(alert);
          },
        },
      },
    };

    this.listeners = {
      start: function () {
        let good = this.game.players.filter((p) => p.role.alignment !== "Follower" && p.role.alignment !== "Leader");
        this.data.chosenGood = Random.randArrayVal(good);
      }
    };
  }
}

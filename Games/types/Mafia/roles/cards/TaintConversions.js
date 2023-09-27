const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class TaintConversions extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Taint: {
        states: ["Night"],
        flags: ["group", "voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          labels: ["effect"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            this.target.giveEffect("TaintedConversions", infinity);
          },
        },
      },
    };
  }
};

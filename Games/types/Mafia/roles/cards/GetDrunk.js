const Card = require("../../Card");
const { PRIORITY_BARTENDER } = require("../../const/Priority");

module.exports = class GetDrunk extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Get Drunk": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["Mafia"] },
        action: {
          labels: ["drinker"],
          priority: PRIORITY_BARTENDER,
          run: function () {
            if (this.dominates()) {
              this.target.giveEffect("Alcoholic");
            }
          },
        },
      },
    };
  }
};

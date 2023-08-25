const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class Blinder extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Blind: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["Mafia"] },
        action: {
          labels: ["effect", "blind"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            if (this.dominates()) {
              this.target.giveEffect("Blind", 1);
            }
          },
        },
      },
    };
  }
};

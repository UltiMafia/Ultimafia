const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class Polariser extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Polarise: {
        states: ["Night"],
        flags: ["voting", "multi"],
        multiMin: 2,
        multiMax: 2,
        action: {
          labels: ["effect", "polarised"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            if (!this.actor.role.data.polarised) {
              this.actor.role.data.polarised = 0;
            }

            if (!targetA || !targetB) return;

            targetA.giveEffect("Polarised", targetB);
            targetB.giveEffect("Polarised", targetA);

            this.actor.role.data.polarised++;

          },
        },
      },
    };
  }
};

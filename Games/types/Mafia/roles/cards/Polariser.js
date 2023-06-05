const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class Polariser extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Polarise: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["effect", "polarised"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            this.target.giveEffect("Polarised");
          },
        },
      },
    };
  }
};

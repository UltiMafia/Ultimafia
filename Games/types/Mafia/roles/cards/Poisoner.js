const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class Poisoner extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Poison: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["Mafia"] },
        action: {
          labels: ["effect", "poison"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            if (this.dominates()) {
              this.target.giveEffect("Poison", this.actor);
            }
          },
        },
      },
    };
  }
};

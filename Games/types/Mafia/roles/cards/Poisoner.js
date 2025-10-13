const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_EARLY } = require("../../const/Priority");

module.exports = class Poisoner extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Poison: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["Mafia"] },
        action: {
          role: role,
          labels: ["effect", "poison"],
          priority: PRIORITY_EFFECT_GIVER_EARLY,
          run: function () {
            if (this.dominates()) {
              this.role.giveEffect(this.target, "Poison", this.actor);
            }
          },
        },
      },
    };
  }
};

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
          run() {
            this.target.giveEffect("Poison", this.actor);
            this.target.queueAlert(":sy6d: You have been poisoned!", 0);
          },
        },
      },
    };
  }
};

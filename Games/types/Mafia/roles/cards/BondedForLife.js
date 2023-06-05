const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class BondedForLife extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Fall in love": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            this.target.giveEffect("InLoveWith", this.actor);
            let alert = `:sy3g: You fall deathly in love with ${this.actor.name}.`;
            this.target.queueAlert(alert);

            if (this.actor.role.name == "Lover") {
              this.actor.giveEffect("InLoveWith", this.target);
            }
            let selfAlert = `:sy3g: You fall deathly in love with ${this.target.name}.`;
            this.actor.queueAlert(selfAlert);

            this.actor.role.loved = true;
          },
        },
        shouldMeet() {
          return !this.loved;
        },
      },
    };
  }
};

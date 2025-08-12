const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_EARLY } = require("../../const/Priority");

module.exports = class BondedForLife extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Love Forever": {
        actionName: "Fall in Love",
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_EFFECT_GIVER_EARLY,
          run: function () {
            this.target.giveEffect("Lovesick", this.actor);
            this.queueGetEffectAlert("Lovesick", this.target, this.actor.name);

            if (this.actor.role.name == "Lover") {
              this.actor.giveEffect("Lovesick", this.target);
            }
            this.queueGetEffectAlert("Lovesick", this.actor, this.target.name);

            this.actor.role.loved = true;
            this.actor.role.loves = this.target;
          },
        },
        shouldMeet() {
          return !this.loved;
        },
      },
    };
  }
};

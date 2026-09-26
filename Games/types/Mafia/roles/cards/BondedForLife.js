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
          role: role,
          priority: PRIORITY_EFFECT_GIVER_EARLY,
          run: function () {
            if (!this.actor || !this.target || typeof this.target !== "object" || !this.target.name) return;
            this.role.giveEffect(this.target, "Lovesick", this.actor);
            this.queueGetEffectAlert("Lovesick", this.target, this.actor.name);

            if (this.actor.role && this.actor.role.name == "Lover") {
              this.role.giveEffect(this.actor, "Lovesick", this.target);
            }
            this.queueGetEffectAlert("Lovesick", this.actor, this.target.name);

            if (this.actor.role) {
              this.actor.role.loved = true;
              this.actor.role.loves = this.target;
            }
          },
        },
        shouldMeet() {
          return !this.loved;
        },
      },
    };
  }
};

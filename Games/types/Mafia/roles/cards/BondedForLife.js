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
            this.queueGetEffectAlert(
              "InLoveWith",
              this.target,
              this.actor.name
            );

            if (this.actor.role.name == "Lover") {
              this.actor.giveEffect("InLoveWith", this.target);
            }
            this.queueGetEffectAlert(
              "InLoveWith",
              this.actor,
              this.target.name
            );

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

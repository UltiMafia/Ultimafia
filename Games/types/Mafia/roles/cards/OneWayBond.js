const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class OneWayBond extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Love Forever": {
        actionName: "Fall in Love",
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          role: this.role,
          run: function () {
            if (this.role.name == "Yandere") {
              this.actor.giveEffect("Lovesick", this.target);
            }
            this.queueGetEffectAlert("Lovesick", this.actor, this.target.name);

            this.role.loved = true;
          },
        },
        shouldMeet() {
          return !this.loved;
        },
      },
    };
  }
};

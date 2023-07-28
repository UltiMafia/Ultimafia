const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class LeechForLife extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Pick Host": {
        states: ["Night"],
        flags: ["voting", "absolute", "mustAct"],
        action: {
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            if (this.isInsane()) return;

            this.target.giveEffect("Insanity");
            this.actor.role.data.host = this.target;
            this.actor.giveEffect("HostImmunity", this.target);
            this.actor.role.hosted = true;
          },
        },
        shouldMeet() {
          return !this.hosted;
        },
      },
    };
  }
};

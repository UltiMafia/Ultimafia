const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class NightWoozy extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Gas: {
        actionName: "Anesthetize",
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["dead", "self"] },
        action: {
          labels: ["effect", "woozy"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            if (this.dominates())
              this.role.giveEffect(this.target, "Woozy", this.actor);
          },
        },
      },
    };
  }
};

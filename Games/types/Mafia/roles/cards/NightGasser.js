const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class NightGasser extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Gas: {
        actionName: "Anesthetize",
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["dead", "self"] },
        action: {
          labels: ["effect", "gas"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            if (this.dominates()) this.role.giveEffect(this.target, "Gassed", this.actor);
          },
        },
      },
    };
  }
};

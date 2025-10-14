const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class Zombify extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Zombify: {
        states: ["Night"],
        flags: ["voting", "group"],
        targets: { include: ["alive"], exclude: ["Cult"] },
        action: {
          labels: ["effect", "zombification"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            this.role.giveEffect(this.target, "Zombification", this.actor);
          },
        },
      },
    };
  }
};

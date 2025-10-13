const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class Fiddler extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Fiddle: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          role: role,
          labels: ["effect", "fiddled"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            this.role.giveEffect(this.target, "Fiddled", 1);
          },
        },
      },
    };
  }
};

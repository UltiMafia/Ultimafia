const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class Polariser extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Polarize Someone": {
        states: ["Night"],
        flags: ["voting", "group", "speech"],
        targets: { include: ["alive"], exclude: ["members"] },
        action: {
          labels: ["effect", "polarised"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            this.target.giveEffect("Polarised");
          },
        },
      },
      "Polarize Someone Else": {
        states: ["Night"],
        flags: ["voting", "group"],
        targets: { include: ["alive"], exclude: ["members"] },
        action: {
          labels: ["effect", "polarised"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            this.target.giveEffect("Polarised");
          },
        },
      },
    };
  }
};

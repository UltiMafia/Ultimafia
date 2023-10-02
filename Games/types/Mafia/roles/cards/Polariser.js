const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class Polariser extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Polarize Someone": {
        states: ["Night"],
        flags: ["voting", "group", "speech", "multiActor"],
        targets: { include: ["alive"], exclude: ["members"] },
        multiMin: 2,
        multiMax: 2,
        action: {
          labels: ["effect", "polarised"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            this.target[0].giveEffect("Polarised");
            this.target[1].giveEffect("Polarised");
          },
        },
      },
      "Polarize Someone Else": {
        states: ["Night"],
        flags: ["voting", "group", "multiActor"],
        targets: { include: ["alive"], exclude: ["members"] },
        multiMin: 2,
        multiMax: 2,
        action: {
          labels: ["effect", "polarised"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            this.target[0].giveEffect("Polarised");
            this.target[1].giveEffect("Polarised");
          },
        },
      },
    };
  }
};

const Card = require("../../Card");
const { PRIORITY_EFFECT_REMOVER_DEFAULT } = require("../../const/Priority");

module.exports = class NightNurse extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Nurse: {
        actionName: "Sponge Bath",
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["cleanse"],
          priority: PRIORITY_EFFECT_REMOVER_DEFAULT,
          run: function () {
            this.cleanse(1);
          },
        },
      },
    };
  }
};

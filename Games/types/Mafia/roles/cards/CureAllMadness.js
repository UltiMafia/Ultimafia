const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class CureAllMadness extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
          priority: PRIORITY_EFFECT_GIVER_DEFAULT + 1,
          run: function () {
            // cure insanity
            if (this.target.hasEffect("Insanity")) {
              this.target.removeEffect("Insanity", true);
          }
        },
      }
    ]
  };
};

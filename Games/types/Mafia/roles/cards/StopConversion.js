const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class CureAllMadness extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Prevent Conversion": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_EFFECT_GIVER_DEFAULT + 1,
          run: function () {
            this.target.setTempImmunity("convert", 1);

            // converts hostiles to villagers/traitors
            if (alignment == "Hostile") {
              if (this.actor.role.name == "Shrink") {
                this.target.setRole("Villager");
              } else if (this.actor.role.name == "Enforcer") {
                this.target.setRole("Traitor");
              }
            }
          },
        },
      },
    };
  }
};

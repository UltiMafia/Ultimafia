const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class NightConvertBlocker extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Tell Me About Your Mother": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["convert blocker"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT + 1,
          run: function () {
            // cure insanity

            // prevents conversion
            this.target.setTempImmunity("convert", 1);

            // converts hostile thirds to villagers/traitors
            if (
              this.target.role.alignment == "Independent" &&
              this.game.getRoleTags(this.target.role.name).includes("Hostile")
            ) {
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

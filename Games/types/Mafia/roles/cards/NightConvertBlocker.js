const Card = require("../../Card");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class NightConvertBlocker extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Tell Me About Your Mother": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["convert blocker"],
          priority: PRIORITY_NIGHT_SAVER - 1,
          role: this.role,
          run: function () {
            // cure insanity

            // prevents conversion
            this.target.setTempImmunity("convert", 1);

            // converts hostile thirds to villagers/traitors
            if (
              this.target.role.alignment == "Independent" &&
              this.game
                .getRoleTags(this.target.getRoleName())
                .includes("Hostile")
            ) {
              if (this.role.name == "Shrink") {
                this.target.setRole("Villager");
              } else if (this.role.name == "Enforcer") {
                this.target.setRole("Traitor");
              }
            }
          },
        },
      },
    };
  }
};

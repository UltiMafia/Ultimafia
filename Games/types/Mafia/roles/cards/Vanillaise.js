const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");

module.exports = class Vanillaise extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Vanillaise: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["convert"],
          priority: PRIORITY_CONVERT_DEFAULT,
          run: function () {
            if (this.dominates()) {
              const vanillaRole = this.getVanillaRole(this.target);
              this.target.setRole(vanillaRole);
            }
          },
        },
      },
    };
  }
};

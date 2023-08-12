const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");

module.exports = class SuckBlood extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Suck Blood": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["convert", "kill"],
          priority: PRIORITY_CONVERT_DEFAULT,
          run: function () {
            if (this.checkVanilla(this.target)) {
              if (this.dominates()) this.target.kill("basic", this.actor);
            } else {
              this.makeVanilla(this.target);
            }
          },
        },
      },
    };
  }
};

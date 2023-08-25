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
            this.makeVanilla(this.target);
          },
        },
      },
    };
  }
};

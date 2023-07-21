const Card = require("../../Card");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class DeityProtector extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Save: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["save"],
          priority: PRIORITY_NIGHT_SAVER,
          run: function () {
            this.deityProtect();
          },
        },
      },
    };
  }
};

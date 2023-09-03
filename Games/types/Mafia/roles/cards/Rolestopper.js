const Card = require("../../Card");
const { PRIORITY_UNTARGETABLE } = require("../../const/Priority");

module.exports = class Rolestopper extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Stop: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["stop"],
          priority: PRIORITY_UNTARGETABLE,
          run: function () {
            this.makeUntargetable();
          },
        },
      },
    };
  }
};

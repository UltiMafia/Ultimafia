const Card = require("../../Card");
const { PRIORITY_SUPPORT_VISIT_DEFAULT } = require("../../const/Priority");

module.exports = class Visit extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Visit: {
        states: ["Night"],
        flags: ["voting", "noVeg"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          priority: PRIORITY_SUPPORT_VISIT_DEFAULT,
          run: function () {},
        },
      },
    };
  }
};

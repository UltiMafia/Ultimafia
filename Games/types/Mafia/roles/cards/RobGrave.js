const Card = require("../../Card");
const { PRIORITY_ITEM_TAKER_DEFAULT } = require("../../const/Priority");

module.exports = class RobGrave extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Rob Grave": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["dead"], exclude: ["alive", "self"] },
        action: {
          labels: ["stealItem"],
          priority: PRIORITY_ITEM_TAKER_DEFAULT,
          run: function () {
            // get role
            var role = this.target.getRoleAppearance();
            this.actor.queueAlert(
              `:saw: You learn that ${this.target.name}'s role is ${role}.`
            );

            // steal items
            this.stealAllItems();
          },
        },
      },
    };
  }
};

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
          run() {
            // get role
            const role = this.target.getAppearance("investigate", true);
            this.actor.queueAlert(
              `:sy0h: You learn that ${this.target.name}'s role is ${role}.`
            );

            // steal items
            this.stealAllItems();
          },
        },
      },
    };
  }
};

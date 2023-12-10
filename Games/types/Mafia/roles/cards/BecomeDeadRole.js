const Card = require("../../Card");
const { PRIORITY_BECOME_DEAD_ROLE } = require("../../const/Priority");

module.exports = class BecomeDeadRole extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Become Role": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["dead"], exclude: [""] },
        action: {
          priority: PRIORITY_BECOME_DEAD_ROLE,
          run: function () {
            this.actor.setRole(
              `${this.target.role.name}:${this.target.role.modifier}`,
              this.target.role.data
            );
            this.game.queueAlert(
              `The Amnesiac remembered that they were a ${this.target.role.name}!`
            );
          },
        },
      },
    };
  }
};

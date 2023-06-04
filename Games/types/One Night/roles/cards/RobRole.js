const Card = require("../../Card");

module.exports = class RobRole extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Rob Role": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: -25,
          run: function () {
            var oldTargetRole = `${this.target.role.name}:${this.target.role.modifier}`;

            this.target.setRole(
              `${this.actor.role.name}:${this.actor.role.modifier}`,
              null,
              true
            );
            this.actor.setRole(oldTargetRole);
          },
        },
      },
    };
  }
};

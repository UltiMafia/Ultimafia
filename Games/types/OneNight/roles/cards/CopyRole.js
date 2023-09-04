const Card = require("../../Card");

module.exports = class CopyRole extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Copy Role": {
        states: ["Night"],
        flags: ["voting", "instant", "mustAct"],
        action: {
          run: function () {
            this.actor.setRole(
              `${this.target.role.name}:${this.target.role.modifier}`
            );
            this.actor.role.priorityOffset = -1;

            if (this.actor.role.name != "Doppelganger") {
              this.actor.joinMeetings(this.actor.role.meetings);
              this.actor.sendMeetings();
            }
          },
        },
      },
    };
  }
};

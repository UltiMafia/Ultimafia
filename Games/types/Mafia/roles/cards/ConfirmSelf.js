const Card = require("../../Card");
const { PRIORITY_CONFIRM_SELF } = require("../../const/Priority");

module.exports = class ConfirmSelf extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Reveal Identity": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_CONFIRM_SELF,
          run: function () {
            var alert = `:sy2i: You learn that ${this.actor.name}'s role is ${this.actor.getRoleAppearance()}.`;
            this.target.queueAlert(alert);
          },
        },
      },
    };
  }
};

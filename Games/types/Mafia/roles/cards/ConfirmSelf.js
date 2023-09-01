const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class ConfirmSelf extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Reveal Identity": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            var alert = `:learnrole: You learn that ${
              this.actor.name
            }'s role is ${this.actor.getRoleAppearance()}.`;
            this.target.queueAlert(alert);
          },
        },
      },
    };
  }
};

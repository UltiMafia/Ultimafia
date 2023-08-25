const Card = require("../../Card");
const { PRIORITY_NIGHT_SAVER, PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");

module.exports = class ConvertSave extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Save": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["save"],
          priority: PRIORITY_NIGHT_SAVER, PRIORITY_CONVERT_DEFAULT,
          run: function () {
            this.actor.role.savedPlayer = this.target;
          },
        },
      },
    };

    this.listeners = {
      convert: function (action, player) {
        if (action.hasLabel("kill")) {
            this.target.setRole("Cultist");
        }
      },
    };
  }
};

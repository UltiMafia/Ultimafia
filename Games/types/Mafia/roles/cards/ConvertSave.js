const Card = require("../../Card");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class ConvertSave extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Save: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["save", "convert", "cult"],
          priority: PRIORITY_NIGHT_SAVER,
          run: function () {
            this.heal(1);

            let killers = this.getVisitors(this.target, "kill");
            if (killers.length == 0) {
              return;
            }

            this.actor.role.killers = killers;
            this.actor.role.savedRole = this.target.role.name;
            this.target.setRole("Cultist");
          },
        },
      },
    };
  }
};

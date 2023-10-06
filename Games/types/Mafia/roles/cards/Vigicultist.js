const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class Vigicultist extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Kill Unbelievers": {
        actionName: "Kill",
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {

            let savers = this.getVisitors(this.target, "save");
            if (savers.length == 0) {
              this.target.kill("basic", this.actor);
            }

            this.actor.role.savers = savers;
            this.actor.role.setRole("Cultist", this.actor);
          },
        },
      },
    };
  }
};

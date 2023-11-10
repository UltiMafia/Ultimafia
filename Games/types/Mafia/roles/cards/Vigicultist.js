const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class Vigicultist extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Kill: {
        actionName: "Kill Unbelievers",
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["Cult"] },
        action: {
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {

            let savers = this.getVisitors(this.target, "save");
            if (savers.length == 0) {
              this.target.kill("basic", this.actor);
            }

            if (savers.length > 0) {
            this.target.setRole("Cultist", this.actor);
            }
          },
        },
      },
    };
  }
};
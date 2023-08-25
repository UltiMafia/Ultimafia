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
            if (this.dominates()) this.target.kill("basic", this.actor);
            else if (action.hasLabel("save")) {
               action.cancel() && this.target.setRole("Cultist"); 
            }
          },
        },
      },
    };
  }
};
